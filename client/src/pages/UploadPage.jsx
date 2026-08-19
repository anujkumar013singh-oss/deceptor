import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video as VideoIcon,
  CheckCircle,
  Copy,
  ExternalLink,
  AlertCircle,
  X,
  Play,
  Sparkles,
  Zap,
  Radio,
  Share2,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';
import api from '../lib/api';
import { formatDuration, formatFileSize, copyToClipboard, getUniversalAddress } from '../lib/utils';
import toast from 'react-hot-toast';

const MAX_DURATION_SECONDS = 3 * 60 * 60; // 3 hours

const UPLOAD_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  FINALIZING: 'finalizing',
  DONE: 'done',
  ERROR: 'error',
};

const UploadPage = () => {
  const [state, setState] = useState(UPLOAD_STATES.IDLE);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, width: 0, height: 0, thumbnailDataUrl: '' });
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  // ── Extract metadata & thumbnail preview ────────────────────────────────
  const extractVideoDetails = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('video/')) {
        return resolve({ duration: 0, width: 1920, height: 1080, thumbnailDataUrl: '' });
      }

      const objUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objUrl);
        } catch (_) {}
      };

      video.onloadedmetadata = () => {
        if (video.duration > MAX_DURATION_SECONDS) {
          cleanup();
          toast.error(`Video exceeds maximum 3-hour capacity (${formatDuration(video.duration)}).`);
          return resolve({ duration: video.duration, width: video.videoWidth || 1920, height: video.videoHeight || 1080, thumbnailDataUrl: '' });
        }

        // Try seeking to 1s to capture thumbnail frame
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          cleanup();
          resolve({
            duration: video.duration || 0,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
            thumbnailDataUrl,
          });
        } catch (_) {
          cleanup();
          resolve({ duration: video.duration || 0, width: 1920, height: 1080, thumbnailDataUrl: '' });
        }
      };

      video.onerror = () => {
        cleanup();
        resolve({ duration: 0, width: 1920, height: 1080, thumbnailDataUrl: '' });
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
      setError(typeof err === 'string' ? err : 'Error reading video file.');
      setState(UPLOAD_STATES.ERROR);
      setSelectedFile(null);
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

  // ── Upload Execution ────────────────────────────────────────────────────
  const handleUpload = () => {
    if (!selectedFile) return;

    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('duration', videoMeta.duration);
    formData.append('width', videoMeta.width);
    formData.append('height', videoMeta.height);
    if (videoMeta.thumbnailDataUrl) {
      formData.append('thumbnailDataUrl', videoMeta.thumbnailDataUrl);
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    const startTime = Date.now();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 95);
        setProgress(pct);

        const elapsedSec = (Date.now() - startTime) / 1000;
        if (elapsedSec > 0.5) {
          const speedMBps = (e.loaded / (1024 * 1024) / elapsedSec).toFixed(1);
          setUploadSpeed(`${speedMBps} MB/s`);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const res = JSON.parse(xhr.responseText);
        setProgress(100);
        setState(UPLOAD_STATES.DONE);
        setResult(res);
        toast.success('Universal link active & ready!');
      } else {
        setState(UPLOAD_STATES.ERROR);
        const errMsg = xhr.responseText ? JSON.parse(xhr.responseText)?.message : 'Upload failed';
        setError(errMsg || 'Upload failed. Please try again.');
        toast.error(errMsg || 'Upload failed');
      }
    };

    xhr.onerror = () => {
      setState(UPLOAD_STATES.ERROR);
      setError('Network communication failed during transfer.');
      toast.error('Network error during upload');
    };

    const token = localStorage.getItem('deceptor_token');
    xhr.open('POST', '/api/videos/upload-direct');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
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
    setVideoMeta({ duration: 0, width: 0, height: 0, thumbnailDataUrl: '' });
    setProgress(0);
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Lossless Ingest Terminal</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Upload & Generate Universal Link
          </h1>
          <p className="font-sans text-sm sm:text-base text-slate-400 mt-1 font-normal">
            Host videos up to 3 hours. Receive a permanent, lifetime-active link that plays on any browser.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Bitrate: Original Lossless</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STATE 1 & 2: Dropzone & File Selection ──────────────────────── */}
        {state !== UPLOAD_STATES.DONE && (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Main Drag-and-Drop Card */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => state === UPLOAD_STATES.IDLE && !selectedFile && fileInputRef.current?.click()}
              className={`relative rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 border-2 ${
                dragging
                  ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
                  : selectedFile
                  ? 'border-blue-500/40 bg-slate-900/40'
                  : 'border-dashed border-white/15 hover:border-cyan-400/50 bg-slate-950/60 cursor-pointer'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              {!selectedFile ? (
                <div className="space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                    <Upload className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white mb-2">
                      Drag & drop your video here
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Supports MP4, WebM, MOV, and MKV. Up to 3 hours long with original audio & video bitrate preservation.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-200 text-black text-sm font-bold transition-all shadow-lg shadow-white/5 cursor-pointer"
                  >
                    Select File from Device
                  </button>
                </div>
              ) : (
                /* Selected File Preview Stage */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/90 border border-white/10 text-left">
                    {videoMeta.thumbnailDataUrl ? (
                      <img
                        src={videoMeta.thumbnailDataUrl}
                        alt="Preview"
                        className="w-full sm:w-48 aspect-video rounded-xl object-cover border border-white/10 shadow-md"
                      />
                    ) : (
                      <div className="w-full sm:w-48 aspect-video rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
                        <VideoIcon className="w-8 h-8 text-cyan-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-lg font-bold text-white truncate">
                          {selectedFile.name}
                        </h4>
                        {state === UPLOAD_STATES.IDLE && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-slate-200">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        {videoMeta.duration > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-cyan-300">
                            ⏱ {formatDuration(videoMeta.duration)}
                          </span>
                        )}
                        {videoMeta.width > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-emerald-400">
                            {videoMeta.width} × {videoMeta.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Action or Progress */}
                  {state === UPLOAD_STATES.IDLE && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={handleUpload}
                        className="btn btn-primary btn-lg w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-[0_0_30px_rgba(56,189,248,0.3)] cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Upload & Generate Universal Link</span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="btn btn-dark w-full sm:w-auto px-6 py-3.5 text-sm"
                      >
                        Choose Different File
                      </button>
                    </div>
                  )}

                  {/* Progress Bar Display */}
                  {state === UPLOAD_STATES.UPLOADING && (
                    <div className="space-y-3 p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-300 font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          Streaming to High-Performance Storage...
                        </span>
                        <span className="text-white font-bold">{progress}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 rounded-full transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Speed: {uploadSpeed || 'Active'}</span>
                        <span>Do not close this window</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 sm:p-12 rounded-3xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_50px_rgba(56,189,248,0.2)] space-y-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
                  Universal Link Generated!
                </h2>
                <p className="text-sm text-slate-400 font-normal">
                  Your video is hosted and permanent. Anyone with this link can stream it in original quality with zero ads.
                </p>
              </div>
            </div>

            {/* Permanent Universal Link URL Box */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#03060f] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                <Radio className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Permanent Universal Link
                  </span>
                  <span className="text-sm sm:text-base font-mono font-bold text-cyan-300 truncate select-all">
                    {universalLink}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  className="btn btn-primary flex-1 sm:flex-initial text-xs px-5 py-3 font-bold cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Universal Link</span>
                </button>
                <a
                  href={universalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-dark flex-1 sm:flex-initial text-xs px-4 py-3 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Open Full Player</span>
                </a>
              </div>
            </div>

            {/* Live Interactive Video Player Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-mono text-slate-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" /> Instant Stream Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ● CLOUD CDN ACTIVE
                </span>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl relative group">
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
                  <div className="text-xs text-slate-400">File Name</div>
                  <div className="text-sm font-bold text-white truncate mt-1">
                    {videoData.originalFilename || videoData.title || selectedFile?.name || 'video.mp4'}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400">Duration</div>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    {formatDuration(videoData.durationSeconds || videoMeta.duration)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400">File Size</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {formatFileSize(videoData.fileSizeBytes || selectedFile?.size)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-slate-400">Status</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1 uppercase flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Permanent Active
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
