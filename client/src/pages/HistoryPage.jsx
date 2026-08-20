import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Play,
  Copy,
  ExternalLink,
  Trash2,
  Search,
  AlertCircle,
  Eye,
  Film,
  HardDrive,
  CheckCircle,
  X,
  Radio,
  Upload,
} from 'lucide-react';
import api from '../lib/api';
import { formatDuration, formatFileSize, formatDate, copyToClipboard, getUniversalAddress } from '../lib/utils';
import toast from 'react-hot-toast';

const HistoryPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [brokenThumbs, setBrokenThumbs] = useState({});

  const getThumbnailFallback = (video) => {
    const title = (video.title || video.originalFilename || 'Video').replace(/\.[^/.]+$/, '');
    const dur = video.durationSeconds ? formatDuration(video.durationSeconds) : '3HR CAPACITY';
    return (
      <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-[#0a1226] to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover/thumb:scale-105 transition-transform duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)]" />
        <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
          <Film className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-white text-center line-clamp-1 max-w-[90%] relative z-10 font-display">
          {title}
        </span>
        <span className="text-[10px] font-bold text-cyan-400 mt-1 relative z-10 uppercase tracking-wider">
          {dur} • READY
        </span>
      </div>
    );
  };

  const fetchVideos = async () => {
    try {
      const res = await api.get('/videos/my-history?limit=50');
      setVideos(res.data.videos || []);
    } catch (err) {
      toast.error('Failed to load video library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleCopyLink = (shortId) => {
    const url = getUniversalAddress(shortId);
    copyToClipboard(url);
    toast.success('Permanent Deceptor link copied!');
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/videos/${deleteModal._id}`);
      setVideos((prev) => prev.filter((v) => v._id !== deleteModal._id));
      toast.success('Video removed.');
      setDeleteModal(null);
    } catch (err) {
      toast.error('Failed to delete video.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredVideos = videos.filter((v) =>
    (v.title || v.originalFilename || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>Permanent Storage Library</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Video Library
          </h1>
          <p className="font-sans text-sm sm:text-base text-slate-400 mt-1 font-normal">
            Manage your permanent links, view telemetry statistics, and share universal addresses.
          </p>
        </div>

        <Link
          to="/panel/upload"
          className="btn btn-primary text-xs px-5 py-3 font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Host New Video</span>
        </Link>
      </div>

      {/* ── Search & Filter Strip ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos by title..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900/80 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span>Total Hosted: <strong className="text-white">{videos.length}</strong></span>
        </div>
      </div>

      {/* ── Videos Grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-3xl p-4 bg-slate-950/60 border border-white/10 animate-pulse space-y-3">
              <div className="aspect-video w-full rounded-2xl bg-slate-900" />
              <div className="h-4 w-3/4 bg-slate-900 rounded" />
              <div className="h-3 w-1/2 bg-slate-900 rounded" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-white">No videos found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {search ? 'Try a different search term.' : 'Upload your first video to generate permanent universal links.'}
          </p>
          <Link to="/panel/upload" className="btn btn-primary text-xs inline-flex">
            Upload Video Now
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const shortUrl = `${window.location.origin}/v/${video.shortLinkId}`;
            return (
              <div
                key={video._id}
                className="rounded-3xl p-4 bg-slate-950/70 hover:bg-slate-950 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  {/* Thumbnail / Video Preview Area */}
                  <div
                    onClick={() => setPreviewVideo(video)}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group/thumb border border-white/10 mb-4"
                  >
                    {video.thumbnailUrl && !brokenThumbs[video._id] ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title || video.originalFilename}
                        onError={() => setBrokenThumbs((prev) => ({ ...prev, [video._id]: true }))}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      getThumbnailFallback(video)
                    )}

                    {/* Play Overlay Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {video.durationSeconds && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                        {formatDuration(video.durationSeconds)}
                      </div>
                    )}

                    {/* Views Count */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-semibold text-cyan-300 flex items-center gap-1 border border-white/10">
                      <Eye className="w-3 h-3" />
                      <span>{video.viewCount || 0} views</span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="font-display text-base font-bold text-white truncate mb-1" title={video.title || video.originalFilename}>
                    {video.title || video.originalFilename}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                    <span>{formatFileSize(video.fileSizeBytes)}</span>
                    <span>•</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyLink(video.shortLinkId)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`/v/${video.shortLinkId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Open Universal Player"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setDeleteModal(video)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Preview Modal ──────────────────────────────────────────── */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-slate-950 border border-white/20 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-lg font-bold text-white truncate">
                  {previewVideo.title || previewVideo.originalFilename}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <video
                src={previewVideo.streamUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Universal Link: <strong className="text-white">{`${window.location.origin}/v/${previewVideo.shortLinkId}`}</strong></span>
              <button
                onClick={() => handleCopyLink(previewVideo.shortLinkId)}
                className="btn btn-primary text-xs px-4 py-2 font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-rose-500/30 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Delete this video?</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              "{deleteModal.title || deleteModal.originalFilename}" will be permanently removed. The universal short link will become inactive.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn btn-dark text-xs px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
