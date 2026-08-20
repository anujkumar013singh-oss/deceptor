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

  // ── Backblaze B2 High-Speed Direct Ingest Engine (Unlimited 3-Hour / 10GB+) ──
  const performUpload = useCallback(async (file, meta) => {
    if (!file) return;

    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);
    setError('');
    setEtaText('Initializing high-speed ingest channel...');
    startTimeRef.current = Date.now();

    try {
      // 1. Get direct Backblaze B2 upload endpoint & authorization token
      const signRes = await api.get('/videos/sign-upload');
      const { uploadUrl, authorizationToken, downloadUrl, bucketName } = signRes.data;

      if (!uploadUrl || !authorizationToken) {
        throw new Error('Failed to acquire storage upload endpoint.');
      }

      setEtaText('Streaming video to cloud...');

      // 2. Generate clean cloud file path
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const cloudFileName = `videos/${Date.now()}_${sanitizedName}`;

      // 3. Direct streaming upload to Backblaze B2
      const b2UploadResponse = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.min(95, Math.round((e.loaded / e.total) * 95));
            setProgress(pct);

            const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
            if (elapsedSec > 0.4) {
              const bytesPerSec = e.loaded / elapsedSec;
              const speedMB = (bytesPerSec / (1024 * 1024)).toFixed(1);
              setUploadSpeed(`${speedMB} MB/s (Backblaze Turbo)`);

              const remainingBytes = e.total - e.loaded;
              const remainingSecs = Math.max(1, Math.round(remainingBytes / bytesPerSec));
              const mins = Math.floor(remainingSecs / 60);
              const secs = remainingSecs % 60;
              setEtaText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({});
            }
          } else {
            let msg = 'Upload failed';
            try {
              const errObj = JSON.parse(xhr.responseText);
              msg = errObj.message || errObj.code || msg;
            } catch {}
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during video transfer. Please check connection.'));
        xhr.ontimeout = () => reject(new Error('Upload timeout. Please retry.'));

        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', authorizationToken);
        xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(cloudFileName));
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.setRequestHeader('Content-Length', String(file.size));
        xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify');

        xhr.send(file);
      });

      if (!b2UploadResponse?.fileId && !b2UploadResponse?.fileName) {
        throw new Error('Storage did not return confirmation token.');
      }

      setProgress(97);
      setEtaText('Generating universal permanent link...');

      // 4. Save metadata to MongoDB Atlas
      const saveRes = await api.post('/videos/save-cloud', {
        fileId: b2UploadResponse.fileId,
        fileName: b2UploadResponse.fileName || cloudFileName,
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
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      const conversionTimeStr = `${m}m ${s < 10 ? '0' : ''}${s}s`;

      setProgress(100);
      setEtaText(`Converted in ${conversionTimeStr}`);
      setState(UPLOAD_STATES.DONE);
      setResult(saveRes.data);
      toast.success(`Video hosted in ${conversionTimeStr}! Universal link ready.`);
    } catch (err) {
      console.error('Upload error:', err);
      setState(UPLOAD_STATES.ERROR);
      setError(err?.message || 'Transfer failed.');
      setEtaText('');
      toast.error(err?.message || 'Upload failed');
    }
  }, []);

  const reset = useCallback(() => {
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
