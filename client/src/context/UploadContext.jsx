import { createContext, useContext, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const UploadContext = createContext(null);

export const UPLOAD_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
};

// Hardware-accelerated WebCrypto SHA-1 computation
const computeSha1 = async (arrayBuffer) => {
  const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Dynamic chunk sizing to maximize TCP pipe saturation and minimize roundtrips
const getOptimalChunkSize = (fileSizeBytes) => {
  if (fileSizeBytes < 60 * 1024 * 1024) return 8 * 1024 * 1024; // 8MB
  if (fileSizeBytes < 300 * 1024 * 1024) return 16 * 1024 * 1024; // 16MB
  if (fileSizeBytes < 1000 * 1024 * 1024) return 24 * 1024 * 1024; // 24MB
  return 32 * 1024 * 1024; // 32MB for multi-GB 3-hour videos
};

export const UploadProvider = ({ children }) => {
  const [state, setState] = useState(UPLOAD_STATES.IDLE);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, width: 0, height: 0, thumbnailDataUrl: '' });
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [etaText, setEtaText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const activeXhrsRef = useRef([]);
  const isAbortedRef = useRef(false);
  const startTimeRef = useRef(null);

  // ── 8x Multi-Stream Parallel Turbo Ingest Engine with Sliding Velocity ────
  const performUpload = useCallback(async (file, meta) => {
    if (!file) return;

    isAbortedRef.current = false;
    activeXhrsRef.current = [];
    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);
    setError('');
    setEtaText('Initializing high-speed multi-socket engine...');
    startTimeRef.current = Date.now();

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloudFileName = `videos/${Date.now()}_${sanitizedName}`;

    const PART_SIZE = getOptimalChunkSize(file.size);
    const totalParts = Math.ceil(file.size / PART_SIZE);

    // Sliding window velocity tracker for accurate, smooth ETA
    const speedSamples = []; // { time, loaded }
    let lastEtaSecs = null;

    try {
      let finalFileId = null;
      let finalFileName = cloudFileName;

      // ── FAST PATH 1: Small files (< 16MB) -> Single direct stream ─────────
      if (file.size < 16 * 1024 * 1024 || totalParts < 2) {
        let singleRes = null;
        let attempts = 0;

        while (attempts < 4 && !singleRes && !isAbortedRef.current) {
          attempts++;
          try {
            const signRes = await api.get('/videos/sign-upload');
            const { uploadUrl, authorizationToken } = signRes.data;

            singleRes = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              activeXhrsRef.current.push(xhr);

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && e.total > 0) {
                  const pct = Math.min(94, Math.round((e.loaded / e.total) * 94));
                  setProgress(pct);

                  const now = Date.now();
                  speedSamples.push({ time: now, loaded: e.loaded });
                  while (speedSamples.length > 2 && now - speedSamples[0].time > 2500) {
                    speedSamples.shift();
                  }

                  const dt = (now - speedSamples[0].time) / 1000;
                  const dBytes = e.loaded - speedSamples[0].loaded;
                  const currentSpeed = dt > 0.15 ? dBytes / dt : e.loaded / ((now - startTimeRef.current) / 1000);
                  const speedMB = (currentSpeed / (1024 * 1024)).toFixed(1);
                  setUploadSpeed(`${speedMB} MB/s (Turbo Stream)`);

                  const remBytes = e.total - e.loaded;
                  const remSecs = Math.max(1, Math.round(remBytes / Math.max(currentSpeed, 1024)));
                  setEtaText(
                    remSecs < 60
                      ? `${remSecs}s remaining`
                      : `${Math.floor(remSecs / 60)}m ${remSecs % 60 < 10 ? '0' : ''}${remSecs % 60}s remaining`
                  );
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try { resolve(JSON.parse(xhr.responseText)); }
                  catch { resolve({}); }
                } else {
                  reject(new Error(`Upload failed (${xhr.status})`));
                }
              };

              xhr.onerror = () => reject(new Error('Network interruption'));
              xhr.open('POST', uploadUrl, true);
              xhr.setRequestHeader('Authorization', authorizationToken);
              xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(cloudFileName));
              xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
              xhr.setRequestHeader('Content-Length', String(file.size));
              xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify');
              xhr.send(file);
            });
          } catch (err) {
            if (attempts >= 4) throw err;
            await new Promise((r) => setTimeout(r, 400 * attempts));
          }
        }

        finalFileId = singleRes.fileId;
        finalFileName = singleRes.fileName || cloudFileName;
      } else {
        // ── FAST PATH 2: 8x Parallel Multi-Socket Turbo Ingest ──────────────
        const startRes = await api.post('/videos/b2/start-large-file', {
          fileName: cloudFileName,
          contentType: file.type || 'video/mp4',
        });

        const fileId = startRes.data.fileId;
        finalFileId = fileId;
        finalFileName = startRes.data.fileName || cloudFileName;

        const CONCURRENCY = Math.min(8, totalParts); // 8 parallel sockets
        const partSha1Array = new Array(totalParts);
        const partLoadedBytes = new Array(totalParts).fill(0);
        let nextPartIndex = 0;

        // Pre-fetched Endpoint Pool for ZERO-latency chunk handoff
        const endpointPool = [];
        let isFetchingEndpoints = false;

        const refillEndpointPool = async () => {
          if (isFetchingEndpoints || isAbortedRef.current) return;
          isFetchingEndpoints = true;
          try {
            const batchRes = await api.post('/videos/b2/get-part-urls-batch', {
              fileId,
              count: 8,
            });
            if (batchRes.data?.endpoints) {
              endpointPool.push(...batchRes.data.endpoints);
            }
          } catch (err) {
            console.warn('Batch endpoint fetch fallback:', err.message);
          } finally {
            isFetchingEndpoints = false;
          }
        };

        // Initial burst pre-fetch of 8 endpoints
        await refillEndpointPool();

        const acquirePartEndpoint = async () => {
          if (endpointPool.length < 4) {
            refillEndpointPool().catch(() => {});
          }
          if (endpointPool.length > 0) {
            return endpointPool.pop();
          }
          // Fallback single endpoint fetch
          const single = await api.post('/videos/b2/get-part-url', { fileId });
          return single.data;
        };

        // Worker: transfers chunk with self-healing retries
        const uploadChunkWithRetry = async (index) => {
          const partNumber = index + 1;
          const startByte = index * PART_SIZE;
          const endByte = Math.min(file.size, startByte + PART_SIZE);
          const chunkBlob = file.slice(startByte, endByte);

          // Read buffer & hardware compute SHA-1
          const arrayBuffer = await chunkBlob.arrayBuffer();
          const sha1 = await computeSha1(arrayBuffer);

          let chunkSuccess = false;
          let attempt = 0;
          const MAX_RETRIES = 5;

          while (!chunkSuccess && attempt < MAX_RETRIES && !isAbortedRef.current) {
            attempt++;
            try {
              const endpoint = await acquirePartEndpoint();

              await new Promise((resolve, reject) => {
                if (isAbortedRef.current) return reject(new Error('Upload aborted'));

                const xhr = new XMLHttpRequest();
                activeXhrsRef.current.push(xhr);

                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable) {
                    partLoadedBytes[index] = e.loaded;

                    // Aggregate loaded bytes across all parallel streams
                    const totalLoaded = partLoadedBytes.reduce((a, b) => a + b, 0);
                    const pct = Math.min(95, Math.round((totalLoaded / file.size) * 95));
                    setProgress(pct);

                    const now = Date.now();
                    speedSamples.push({ time: now, loaded: totalLoaded });
                    while (speedSamples.length > 2 && now - speedSamples[0].time > 2500) {
                      speedSamples.shift();
                    }

                    const dt = (now - speedSamples[0].time) / 1000;
                    const dBytes = totalLoaded - speedSamples[0].loaded;
                    const currentSpeed = dt > 0.15 ? dBytes / dt : totalLoaded / ((now - startTimeRef.current) / 1000);
                    const speedMB = (currentSpeed / (1024 * 1024)).toFixed(1);
                    setUploadSpeed(`${speedMB} MB/s (8x Turbo Acceleration)`);

                    const remainingBytes = file.size - totalLoaded;
                    const rawEtaSecs = Math.max(1, Math.round(remainingBytes / Math.max(currentSpeed, 1024)));

                    // Smooth rolling EMA on seconds remaining to eliminate jitter
                    lastEtaSecs = lastEtaSecs === null ? rawEtaSecs : Math.round(lastEtaSecs * 0.4 + rawEtaSecs * 0.6);

                    let etaDisplay = '';
                    if (lastEtaSecs < 60) {
                      etaDisplay = `${lastEtaSecs}s remaining`;
                    } else {
                      const mins = Math.floor(lastEtaSecs / 60);
                      const secs = lastEtaSecs % 60;
                      etaDisplay = `${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`;
                    }
                    setEtaText(etaDisplay);
                  }
                };

                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                      const resJson = JSON.parse(xhr.responseText);
                      partSha1Array[index] = resJson.contentSha1 || sha1;
                      partLoadedBytes[index] = arrayBuffer.byteLength;
                      resolve(resJson);
                    } catch {
                      partSha1Array[index] = sha1;
                      resolve({});
                    }
                  } else {
                    reject(new Error(`Chunk ${partNumber} status ${xhr.status}`));
                  }
                };

                xhr.onerror = () => reject(new Error(`Stream ${partNumber} network reset`));
                xhr.ontimeout = () => reject(new Error(`Stream ${partNumber} timeout`));
                xhr.timeout = 120000; // 2 minutes per chunk timeout

                xhr.open('POST', endpoint.uploadUrl, true);
                xhr.setRequestHeader('Authorization', endpoint.authorizationToken);
                xhr.setRequestHeader('X-Bz-Part-Number', String(partNumber));
                xhr.setRequestHeader('Content-Length', String(arrayBuffer.byteLength));
                xhr.setRequestHeader('X-Bz-Content-Sha1', sha1);
                xhr.send(arrayBuffer);
              });

              chunkSuccess = true;
            } catch (chunkErr) {
              if (isAbortedRef.current) throw chunkErr;
              console.warn(`Stream ${partNumber} attempt ${attempt} retrying:`, chunkErr.message);
              if (attempt >= MAX_RETRIES) {
                throw new Error(`Stream ${partNumber} failed after retries: ${chunkErr.message}`);
              }
              await new Promise((r) => setTimeout(r, Math.min(2000, 250 * Math.pow(1.4, attempt))));
            }
          }
        };

        // Worker thread function
        const worker = async () => {
          while (nextPartIndex < totalParts && !isAbortedRef.current) {
            const index = nextPartIndex++;
            await uploadChunkWithRetry(index);
          }
        };

        // Run 8-socket worker pool concurrently
        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);

        if (isAbortedRef.current) return;

        setEtaText('Finalizing cloud assembly (1-2s)...');
        setProgress(96);

        // Commit large file assembly on Backblaze B2
        await api.post('/videos/b2/finish-large-file', {
          fileId,
          partSha1Array,
        });
      }

      setProgress(98);
      setEtaText('Activating permanent universal link...');

      // Save video record to MongoDB Atlas
      const saveRes = await api.post('/videos/save-cloud', {
        fileId: finalFileId,
        fileName: finalFileName,
        duration: meta?.duration || 0,
        width: meta?.width || 1920,
        height: meta?.height || 1080,
        bytes: file.size,
        original_filename: file.name,
        format: file.name.split('.').pop() || 'mp4',
        title: file.name.replace(/\.[^/.]+$/, ''),
        thumbnailDataUrl: meta?.thumbnailDataUrl || null,
      });

      // Calculate conversion time
      const totalSecs = (Date.now() - startTimeRef.current) / 1000;
      let conversionTimeStr = '';
      if (totalSecs < 60) {
        conversionTimeStr = `${Math.max(1, Math.round(totalSecs))}s`;
      } else {
        const m = Math.floor(totalSecs / 60);
        const s = Math.round(totalSecs % 60);
        conversionTimeStr = `${m}m ${s < 10 ? '0' : ''}${s}s`;
      }

      setProgress(100);
      setEtaText(`Converted in ${conversionTimeStr}`);
      setState(UPLOAD_STATES.DONE);
      setResult(saveRes.data);
      toast.success(`Video converted & hosted in ${conversionTimeStr}! Universal link ready.`);
    } catch (err) {
      if (!isAbortedRef.current) {
        console.error('Turbo upload error:', err);
        setState(UPLOAD_STATES.ERROR);
        setError(err?.message || 'Transfer failed. Please check network.');
        setEtaText('');
        toast.error(err?.message || 'Upload failed');
      }
    }
  }, []);

  const reset = useCallback(() => {
    isAbortedRef.current = true;
    activeXhrsRef.current.forEach((xhr) => {
      try { xhr.abort(); } catch {}
    });
    activeXhrsRef.current = [];

    setState(UPLOAD_STATES.IDLE);
    setSelectedFile(null);
    setVideoMeta({ duration: 0, width: 0, height: 0, thumbnailDataUrl: '' });
    setProgress(0);
    setUploadSpeed('');
    setEtaText('');
    setResult(null);
    setError('');
  }, []);

  return (
    <UploadContext.Provider
      value={{
        state, setState,
        selectedFile, setSelectedFile,
        videoMeta, setVideoMeta,
        progress, setProgress,
        uploadSpeed,
        etaText,
        result,
        error, setError,
        performUpload,
        reset,
        UPLOAD_STATES,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
};
