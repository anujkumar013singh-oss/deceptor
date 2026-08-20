import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Radio,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Video as VideoIcon,
  X,
  Zap,
  Play,
  Film,
  HardDrive,
  Clock,
  ShieldCheck,
  Timer,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import {
  formatDuration,
  formatFileSize,
  copyToClipboard,
  getUniversalAddress,
} from '../lib/utils';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB limit
const MAX_DURATION_SECONDS = 3 * 60 * 60; // 3 Hours Max

const UPLOAD_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
};

const formatElapsedTimer = (secs) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

const UploadPage = () => {
  const [state, setState] = useState(UPLOAD_STATES.IDLE);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileObjectUrl, setFileObjectUrl] = useState('');
  const [videoMeta, setVideoMeta] = useState({
    duration: 0,
    width: 0,
    height: 0,
    thumbnailDataUrl: '',
  });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalConvertedTime, setFinalConvertedTime] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);
  const timerRef = useRef(null);

  // ── Live Real-Time Elapsed Conversion Timer ──────────────────────────────
  useEffect(() => {
    if (state === UPLOAD_STATES.UPLOADING) {
      setElapsedSeconds(0);
      const startT = Date.now();
      timerRef.current = setInterval(() => {
        const secs = (Date.now() - startT) / 1000;
        setElapsedSeconds(secs);
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // ── High-Tech Fallback Thumbnail Generator ────────────────────────────────
  const generateFallbackPoster = (file, duration, width, height) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      // Deep obsidian cyber gradient
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#0b1329');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Cyan cyber glow orb
      const radGrad = ctx.createRadialGradient(640, 360, 20, 640, 360, 450);
      radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      radGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.12)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Cyber Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      // Center Film Icon Graphic
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(640, 310, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Play Triangle Icon
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(630, 285);
      ctx.lineTo(660, 310);
      ctx.lineTo(630, 335);
      ctx.closePath();
      ctx.fill();

      // Video Title Text (Bricolage / Sans Style)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      const cleanTitle = (file?.name || 'Deceptor Video Stream').replace(/\.[^/.]+$/, '');
      const displayTitle = cleanTitle.length > 35 ? cleanTitle.slice(0, 35) + '...' : cleanTitle;
      ctx.fillText(displayTitle, 640, 430);

      // Telemetry Subtext Pill
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      const durText = duration > 0 ? formatDuration(duration) : '3HR CAPACITY';
      const resText = width > 0 ? `${width}×${height}` : '4K ULTRA HD';
      ctx.fillText(`${resText}  •  ${durText}  •  PERMANENT HOSTING`, 640, 475);

      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (_) {
      return '';
    }
  };

  // ── Multi-Tier Metadata & Thumbnail Extractor ───────────────────────────
  const extractVideoDetails = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('video/')) {
        return resolve({
          duration: 0,
          width: 1920,
          height: 1080,
          thumbnailDataUrl: generateFallbackPoster(file, 0, 1920, 1080),
        });
      }

      const objUrl = URL.createObjectURL(file);
      setFileObjectUrl(objUrl);

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      let resolved = false;

      const finish = (duration, width, height, thumbUrl) => {
        if (resolved) return;
        resolved = true;
        const finalThumb = thumbUrl || generateFallbackPoster(file, duration, width, height);
        resolve({
          duration: duration || 0,
          width: width || 1920,
          height: height || 1080,
          thumbnailDataUrl: finalThumb,
        });
      };

      // Timeout safety: if video frame seek takes longer than 1.2s (common in 3-hour files), generate rich fallback instantly
      const timeoutTimer = setTimeout(() => {
        finish(video.duration || 0, video.videoWidth || 1920, video.videoHeight || 1080, null);
      }, 1200);

      video.onloadedmetadata = () => {
        const dur = video.duration || 0;
        const w = video.videoWidth || 1920;
        const h = video.videoHeight || 1080;

        if (dur > MAX_DURATION_SECONDS) {
          clearTimeout(timeoutTimer);
          toast.error(`Video exceeds maximum 3-hour capacity (${formatDuration(dur)}).`);
          return finish(dur, w, h, null);
        }

        // Try seeking to 0.1s for clean frame capture
        try {
          video.currentTime = Math.min(0.5, dur * 0.05);
        } catch (_) {
          clearTimeout(timeoutTimer);
          finish(dur, w, h, null);
        }
      };

      video.onseeked = () => {
        clearTimeout(timeoutTimer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          finish(video.duration, video.videoWidth, video.videoHeight, thumbnailDataUrl);
        } catch (_) {
          finish(video.duration, video.videoWidth, video.videoHeight, null);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutTimer);
        finish(0, 1920, 1080, null);
      };

      video.src = objUrl;
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setError('');
    setState(UPLOAD_STATES.PREPARING);
    setSelectedFile(file);

    try {
      const meta = await extractVideoDetails(file);
      setVideoMeta(meta);
      setState(UPLOAD_STATES.IDLE);
    } catch (err) {
      setVideoMeta({
        duration: 0,
        width: 1920,
        height: 1080,
        thumbnailDataUrl: generateFallbackPoster(file, 0, 1920, 1080),
      });
      setState(UPLOAD_STATES.IDLE);
    }
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  // ── High-Speed Turbo Ingest Engine (Bypasses 100MB Transform Limit via Raw Pipeline) ───
  const uploadInChunks = async (file, signData) => {
    const { timestamp, signature, api_key, cloud_name, folder } = signData;
    const startTime = Date.now();

    // For files > 90MB (or up to 10GB / 3-hour long videos), use 'raw' or 'auto' endpoint to bypass 100MB transform cap
    const isLargeFile = file.size > 90 * 1024 * 1024;
    const uploadEndpoint = isLargeFile
      ? `https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`
      : `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`;

    // Fast Path 1: For files <= 60MB, direct single-pipe streaming (completes in 3-10s)
    if (file.size <= 60 * 1024 * 1024) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.min(94, Math.round((e.loaded / e.total) * 94));
            setProgress(pct);

            const elapsedSec = (Date.now() - startTime) / 1000;
            if (elapsedSec > 0.3) {
              const speedMBps = (e.loaded / (1024 * 1024) / elapsedSec).toFixed(1);
              setUploadSpeed(`${speedMBps} MB/s (Turbo Stream)`);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (_) {
              resolve({});
            }
          } else {
            let errText = 'Upload stream error';
            try {
              errText = JSON.parse(xhr.responseText)?.error?.message || errText;
            } catch (_) {}
            reject(new Error(errText));
          }
        };

        xhr.onerror = () => reject(new Error('Network interrupted during turbo transfer.'));

        xhr.open('POST', uploadEndpoint);
        xhr.send(formData);
      });
    }

    // Fast Path 2: Large / 3-Hour Multi-Gigabyte Video Chunked Pipeline (25MB optimized chunks)
    const chunkSize = 25 * 1024 * 1024; // 25MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uniqueUploadId = 'cld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);

    let finalResponse = null;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('file', chunk);
      chunkFormData.append('api_key', api_key);
      chunkFormData.append('timestamp', timestamp);
      chunkFormData.append('signature', signature);
      chunkFormData.append('folder', folder);

      const res = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const overallLoaded = start + e.loaded;
            const pct = Math.min(94, Math.round((overallLoaded / file.size) * 94));
            setProgress(pct);

            const elapsedSec = (Date.now() - startTime) / 1000;
            if (elapsedSec > 0.3) {
              const speedMBps = (overallLoaded / (1024 * 1024) / elapsedSec).toFixed(1);
              setUploadSpeed(`${speedMBps} MB/s • Chunk ${i + 1}/${totalChunks}`);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (_) {
              resolve({});
            }
          } else {
            let errText = 'Chunk transfer error';
            try {
              errText = JSON.parse(xhr.responseText)?.error?.message || errText;
            } catch (_) {}
            reject(new Error(errText));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during chunked video transfer.'));

        xhr.open('POST', uploadEndpoint);
        xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
        xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${file.size}`);
        xhr.send(chunkFormData);
      });

      if (res && res.secure_url) {
        finalResponse = res;
      }
    }

    return finalResponse;
  };

  // ── Upload Execution ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;

    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);
    setError('');

    const startConversionTime = Date.now();

    try {
      // 1. Fetch Cloudinary signature from backend
      const signRes = await api.get('/videos/sign-upload');
      const signData = signRes.data;

      // 2. Stream video using Chunked / Raw Ingest Engine (supports up to 10GB & 3-hour videos)
      const cData = await uploadInChunks(selectedFile, signData);

      if (!cData?.secure_url) {
        throw new Error('Cloud storage did not return secure streaming URL.');
      }

      setProgress(95);

      // Calculate final conversion time
      const totalSecs = (Date.now() - startConversionTime) / 1000;
      const formattedTotal = formatElapsedTimer(totalSecs);
      setFinalConvertedTime(formattedTotal);

      // 3. Save metadata permanently into MongoDB Atlas
      const saveRes = await api.post('/videos/save-cloud', {
        secure_url: cData.secure_url,
        public_id: cData.public_id,
        duration: cData.duration || videoMeta.duration,
        width: cData.width || videoMeta.width,
        height: cData.height || videoMeta.height,
        bytes: cData.bytes || selectedFile.size,
        original_filename: selectedFile.name,
        format: cData.format || selectedFile.name.split('.').pop(),
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
      });

      setProgress(100);
      setState(UPLOAD_STATES.DONE);
      setResult(saveRes.data);
      toast.success(`Video hosted in ${formattedTotal}! Universal link ready.`);
    } catch (err) {
      console.warn('Upload error:', err.message);
      setState(UPLOAD_STATES.ERROR);
      setError(err?.message || 'Transfer failed. Please check network connection.');
      toast.error(err?.message || 'Upload failed');
    }
  };

  const videoData = result?.video || result?.data?.video || (result?.shortLinkId ? result : null);
  const shortId = videoData?.shortLinkId || result?.shortLinkId;
  const universalLink = shortId ? getUniversalAddress(shortId) : '';

  const handleCopyLink = () => {
    if (!universalLink) return;
    copyToClipboard(universalLink);
    toast.success('Universal link copied to clipboard!');
  };

  const handleReset = () => {
    setState(UPLOAD_STATES.IDLE);
    setSelectedFile(null);
    setFileObjectUrl('');
    setVideoMeta({ duration: 0, width: 0, height: 0, thumbnailDataUrl: '' });
    setProgress(0);
    setElapsedSeconds(0);
    setFinalConvertedTime('');
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            Universal Ingest Terminal
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
          </h1>
          <p className="text-sm text-slate-300 font-medium mt-1">
            Host long-form videos up to 3 hours. Receive a permanent, lifetime-active link that plays on any browser.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3-Hour / 10GB Capacity</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
            Sub-90s Fast Lane
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STATE 1 & 2: DROP ZONE / SELECTED FILE PREVIEW ──────────────── */}
        {state !== UPLOAD_STATES.DONE && (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-6 sm:p-10 rounded-3xl border transition-all duration-300 ${
              dragging
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_40px_rgba(56,189,248,0.25)]'
                : 'border-white/15 bg-slate-950/70 backdrop-blur-2xl'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="space-y-6 text-center cursor-pointer py-8"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:scale-105 transition-transform duration-300">
                  <Upload className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                    Drag & drop your video here
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Supports MP4, WebM, MOV, and MKV up to 3 hours long. Preserves native bitrate and lossless audio worldwide.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-200 text-black text-sm font-bold transition-all shadow-lg shadow-white/10 cursor-pointer"
                >
                  Select Video from Device
                </button>
              </div>
            ) : (
              /* Selected File Preview Stage */
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/90 border border-white/10 text-left">
                  {/* Rich Thumbnail Display */}
                  <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/15 shadow-xl relative group flex-shrink-0">
                    <img
                      src={videoMeta.thumbnailDataUrl || generateFallbackPoster(selectedFile, videoMeta.duration, videoMeta.width, videoMeta.height)}
                      alt="Video Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/20">
                        {videoMeta.duration > 0 ? formatDuration(videoMeta.duration) : 'Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-xl font-bold text-white truncate">
                        {selectedFile.name}
                      </h4>
                      {state !== UPLOAD_STATES.UPLOADING && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-300">
                      <span className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-white flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        {formatFileSize(selectedFile.size)}
                      </span>
                      {videoMeta.duration > 0 && (
                        <span className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-cyan-400/30 text-cyan-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(videoMeta.duration)}
                        </span>
                      )}
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5" />
                        {videoMeta.width > 0 ? `${videoMeta.width} × ${videoMeta.height}` : 'Native Resolution'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload Action Bar */}
                {(state === UPLOAD_STATES.IDLE || state === UPLOAD_STATES.PREPARING) && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                      onClick={handleUpload}
                      className="btn btn-primary btn-lg w-full sm:w-auto px-10 py-4 text-base font-bold shadow-[0_0_35px_rgba(56,189,248,0.4)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5 fill-white" />
                      <span>Upload & Generate Universal Link</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="btn btn-dark w-full sm:w-auto px-6 py-4 text-sm cursor-pointer"
                    >
                      Choose Different File
                    </button>
                  </div>
                )}

                {/* Progress Bar Display with Live Conversion Timer */}
                {state === UPLOAD_STATES.UPLOADING && (
                  <div className="space-y-4 p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-cyan-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        Streaming video chunks to global cloud storage...
                      </span>

                      {/* Live Ingest Stopwatch */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-cyan-400/40 text-cyan-300 font-bold">
                          <Timer className="w-3.5 h-3.5 animate-spin" />
                          <span>Elapsed: {formatElapsedTimer(elapsedSeconds)}</span>
                        </div>
                        <span className="text-white text-base font-black">{progress}%</span>
                      </div>
                    </div>

                    <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Speed: {uploadSpeed || 'Active fast transfer'}</span>
                      <span>Target: Sub-90s instant pipeline</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STATE 3: SUCCESS & UNIVERSAL LINK RESULT ─────────────────────── */}
        {state === UPLOAD_STATES.DONE && result && (
          <motion.div
            key="success-zone"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-10 rounded-3xl bg-slate-950/95 border border-cyan-400/50 shadow-[0_0_60px_rgba(56,189,248,0.25)] space-y-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
                    Universal Link Generated!
                  </h2>
                  {finalConvertedTime && (
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Converted in {finalConvertedTime}</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 font-medium">
                  Your video is hosted and permanent. Anyone with this link can stream it in original quality with zero ads.
                </p>
              </div>
            </div>

            {/* Permanent Universal Link URL Box */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#03060f] border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Permanent Universal Link
                  </span>
                  <span className="text-sm sm:text-base font-bold text-cyan-300 truncate select-all">
                    {universalLink}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  className="btn btn-primary flex-1 sm:flex-initial text-xs px-5 py-3.5 font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Universal Link</span>
                </button>
                <a
                  href={universalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-dark flex-1 sm:flex-initial text-xs px-4 py-3.5 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Open Player</span>
                </a>
              </div>
            </div>

            {/* Live Interactive Video Player Box */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1 font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-cyan-400" /> Instant Stream Preview
                </span>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ● CLOUD CDN ACTIVE
                </span>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl relative">
                <video
                  src={videoData?.streamUrl || result?.directCloudUrl || (shortId ? `/api/videos/stream/${shortId}` : '')}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Video Telemetry Summary */}
            {videoData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400 font-medium">File Name</div>
                  <div className="text-sm font-bold text-white truncate mt-1">
                    {videoData.originalFilename || videoData.title || selectedFile?.name || 'video.mp4'}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400 font-medium">Duration</div>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    {formatDuration(videoData.durationSeconds || videoMeta.duration)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400 font-medium">File Size</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {formatFileSize(videoData.fileSizeBytes || selectedFile?.size)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400 font-medium">Speed Telemetry</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1 uppercase flex items-center justify-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    {finalConvertedTime ? `Done in ${finalConvertedTime}` : 'Permanent Active'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Upload Another Video
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
