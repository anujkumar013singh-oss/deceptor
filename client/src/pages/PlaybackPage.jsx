import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share2,
  Copy,
  AlertCircle,
  Eye,
  CheckCircle,
  Radio,
  Sparkles,
  Cpu,
  Layers,
  ArrowLeft,
  Download,
  Check,
} from 'lucide-react';
import api from '../lib/api';
import { formatDuration, formatFileSize, formatDate, copyToClipboard, getUniversalAddress } from '../lib/utils';
import toast from 'react-hot-toast';

const PlaybackPage = () => {
  const { shortId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    toast.loading('Starting Chrome download...', { id: 'dl-toast' });
    try {
      const downloadUrl = `/api/videos/download/${shortId}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = video?.originalFilename || `${video?.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Downloading video to Chrome Downloads!', { id: 'dl-toast' });
    } catch (err) {
      toast.error('Download failed to start.', { id: 'dl-toast' });
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimerRef = useRef(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await api.get(`/videos/public/${shortId}`);
        setVideo(res.data.video);
        if (res.data.video?.title || res.data.video?.originalFilename) {
          document.title = `${res.data.video.title || res.data.video.originalFilename} — Deceptor`;
        }
      } catch (err) {
        setError(err.message || 'Universal link not found or inactive.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [shortId]);

  const resetControlsTimer = () => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3500);
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.play().then(() => setPlaying(true)).catch(() => {
      // Autoplay with sound might require user gesture; start muted if blocked
      if (videoRef.current) {
        videoRef.current.muted = true;
        setMuted(true);
        videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }
    });
  };

  const handleSeek = (e) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    videoRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !muted;
    setMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const universalUrl = getUniversalAddress(shortId);

  const handleCopy = () => {
    copyToClipboard(universalUrl);
    setCopied(true);
    toast.success('Permanent Deceptor link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl relative z-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-cyan-400/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
            <img src="/logo.svg" alt="Deceptor" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-black text-lg text-white">Deceptor</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-300 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* ── Main Player Container ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 relative z-10 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <p className="font-mono text-xs text-slate-400">CONNECTING UNIVERSAL STREAM...</p>
          </div>
        ) : error ? (
          <div className="p-10 rounded-3xl bg-slate-950/80 border border-rose-500/30 text-center max-w-md space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Video Unavailable</h2>
            <p className="text-sm text-slate-400 font-normal">{error}</p>
            <Link to="/" className="btn btn-primary text-xs inline-flex">
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Ambient Glow Backlight */}
            <div className="relative rounded-3xl p-1 sm:p-2 bg-slate-950/80 border border-white/15 shadow-[0_0_80px_rgba(56,189,248,0.15)] overflow-hidden">
              <div
                ref={playerRef}
                onMouseMove={resetControlsTimer}
                onMouseLeave={() => playing && setShowControls(false)}
                className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none group flex items-center justify-center"
              >
                {videoError ? (
                  <div className="p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                      <Film className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                        {video.title || video.originalFilename}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        This video is safely hosted in its original {video.format ? `.${video.format.toUpperCase()}` : 'raw'} format ({formatFileSize(video.fileSizeBytes)}). Chrome and browser HTML5 players only render MP4/WebM formats natively.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn btn-primary text-xs px-6 py-3.5 font-bold flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{downloading ? 'Starting Download...' : 'Download & Play in VLC / Player'}</span>
                      </button>
                      <button
                        onClick={handleCopy}
                        className="btn btn-dark text-xs px-5 py-3.5 font-bold flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copied ? 'Copied!' : 'Copy Universal Link'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={video.streamUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={handlePlayPause}
                      onError={() => setVideoError(true)}
                      playsInline
                      className="w-full h-full object-contain cursor-pointer"
                    />

                    {/* Big Center Play/Pause Button Indicator */}
                    {!playing && (
                      <div
                        onClick={handlePlayPause}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.6)] transform hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 fill-black ml-1" />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Custom Overlay Controls Strip */}
                <div
                  className={`absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Progress / Seek Bar */}
                  <div
                    onClick={handleSeek}
                    className="relative h-2 w-full bg-white/20 hover:h-3 rounded-full overflow-hidden cursor-pointer transition-all mb-4"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-cyan-300 rounded-full"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between gap-4 text-xs font-mono text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={handlePlayPause} className="p-1 text-white hover:text-cyan-400 transition-colors">
                        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>

                      <div className="flex items-center gap-1.5 group/vol">
                        <button onClick={toggleMute} className="p-1 text-white hover:text-cyan-400 transition-colors">
                          {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={muted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 accent-cyan-400 cursor-pointer hidden sm:block"
                        />
                      </div>

                      <span className="text-slate-300 font-medium">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-blue-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/30">
                        DIRECT STREAM ACTIVE
                      </span>
                      <button onClick={toggleFullscreen} className="p-1 text-white hover:text-cyan-400 transition-colors">
                        {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Video Metadata & Telemetry Strip ─────────────────────────── */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    ● LIFETIME ACTIVE
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Uploaded {formatDate(video.createdAt)}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {video.title || video.originalFilename}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Eye className="w-3.5 h-3.5" />
                    {video.viewCount} views
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(video.fileSizeBytes)}</span>
                  <span>•</span>
                  <span>Original Bitrate Stream</span>
                </div>
              </div>

              {/* Share & Download Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="btn btn-primary text-xs px-5 py-3 font-bold flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn btn-dark text-xs px-4 py-3 flex items-center gap-2 cursor-pointer hover:border-cyan-400/40 hover:text-white transition-all shadow-lg"
                >
                  <Download className={`w-4 h-4 text-cyan-400 ${downloading ? 'animate-bounce' : ''}`} />
                  <span>{downloading ? 'Downloading...' : 'Download Video'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Share Modal ──────────────────────────────────────────────────── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-white/20 p-6 space-y-6 shadow-2xl text-center">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-white">Share Video Link</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 font-normal">
              This universal link is permanent and never expires. Anyone with this link can stream this video instantly.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-300 truncate select-all">{universalUrl}</span>
              <button onClick={handleCopy} className="btn btn-primary text-xs px-3 py-1.5 font-bold">
                Copy
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Watch this video on Deceptor: ${universalUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-900/40 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watch this video on Deceptor: ${universalUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-900/40 transition-colors"
              >
                X / Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(universalUrl)}&text=${encodeURIComponent(video?.title || 'Watch video')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-900/40 transition-colors"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Minimal Footer ───────────────────────────────────────────────── */}
      <footer className="py-6 px-4 text-center text-xs text-slate-500 border-t border-white/5">
        © {new Date().getFullYear()} Deceptor. Permanent Universal Video Hosting.
      </footer>
    </div>
  );
};

export default PlaybackPage;
