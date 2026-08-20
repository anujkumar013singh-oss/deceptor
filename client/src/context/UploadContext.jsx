import { createContext, useContext, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const UploadContext = createContext(null);

const UPLOAD_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
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
  const xhrRef = useRef(null);
  const startTimeRef = useRef(null);

  // ── Chunked Upload Engine ─────────────────────────────────────────────────
  // Uses Cloudinary's chunked upload API with 6MB chunks and Content-Range headers.
  // This bypasses the 100MB per-file limit on Cloudinary free tier.
  // Docs: "Chunked uploads allow files larger than the maximum file size limit for your plan."
  const performUpload = useCallback(async (file, meta) => {
    if (!file) return;

    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);
    setError('');
    setEtaText('Calculating...');
    startTimeRef.current = Date.now();

    try {
      // 1. Get signed credentials from backend
      const signRes = await api.get('/videos/sign-upload');
      const { timestamp, signature, api_key, cloud_name, folder } = signRes.data;

      const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks — within Cloudinary's 5-20MB recommended range
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uniqueUploadId = `dcp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`;

      let finalResponse = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const fd = new FormData();
        fd.append('file', chunk);
        fd.append('api_key', api_key);
        fd.append('timestamp', timestamp);
        fd.append('signature', signature);
        fd.append('folder', folder);

        const chunkResult = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const overallBytes = start + e.loaded;
              const pct = Math.min(94, Math.round((overallBytes / file.size) * 94));
              setProgress(pct);

              // Calculate speed & ETA
              const elapsed = (Date.now() - startTimeRef.current) / 1000;
              if (elapsed > 0.5) {
                const bytesPerSec = overallBytes / elapsed;
                const speedMB = (bytesPerSec / (1024 * 1024)).toFixed(1);
                setUploadSpeed(`${speedMB} MB/s`);

                const remainingBytes = file.size - overallBytes;
                const remainingSecs = remainingBytes / bytesPerSec;
                const mins = Math.floor(remainingSecs / 60);
                const secs = Math.floor(remainingSecs % 60);
                setEtaText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)); }
              catch { resolve({}); }
            } else {
              let msg = 'Upload chunk failed';
              try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; }
              catch {}
              reject(new Error(msg));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during video transfer.'));

          xhr.open('POST', uploadEndpoint);
          xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
          xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${file.size}`);
          xhr.send(fd);
        });

        // The last chunk returns the final upload result with secure_url
        if (chunkResult?.secure_url) {
          finalResponse = chunkResult;
        }
      }

      if (!finalResponse?.secure_url) {
        throw new Error('Cloud did not return a streaming URL. The upload may have been incomplete.');
      }

      setProgress(96);
      setEtaText('Registering permanent link...');

      // 2. Save metadata to MongoDB
      const saveRes = await api.post('/videos/save-cloud', {
        secure_url: finalResponse.secure_url,
        public_id: finalResponse.public_id,
        duration: finalResponse.duration || meta.duration,
        width: finalResponse.width || meta.width,
        height: finalResponse.height || meta.height,
        bytes: finalResponse.bytes || file.size,
        original_filename: file.name,
        format: finalResponse.format || file.name.split('.').pop(),
        title: file.name.replace(/\.[^/.]+$/, ''),
      });

      // Calculate final conversion time
      const totalSecs = (Date.now() - startTimeRef.current) / 1000;
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      const convertedTimeStr = `${m}m ${s < 10 ? '0' : ''}${s}s`;

      setProgress(100);
      setEtaText(`Completed in ${convertedTimeStr}`);
      setState(UPLOAD_STATES.DONE);
      setResult(saveRes.data);
      toast.success(`Video hosted in ${convertedTimeStr}! Link ready.`);
    } catch (err) {
      setState(UPLOAD_STATES.ERROR);
      setError(err?.message || 'Transfer failed.');
      setEtaText('');
      toast.error(err?.message || 'Upload failed');
    }
  }, []);

  const reset = useCallback(() => {
    // Cancel any in-flight XHR
    if (xhrRef.current) {
      try { xhrRef.current.abort(); } catch {}
    }
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
