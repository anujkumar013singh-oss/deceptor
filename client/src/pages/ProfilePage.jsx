import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, FileText, Camera, Save, CheckCircle, Shield, HardDrive, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name cannot be empty.');
    setSaving(true);
    try {
      const res = await api.put('/user/profile', {
        name: formData.name,
        bio: formData.bio,
      });
      updateUser(res.data.user);
      toast.success('Profile preferences updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5" />
          <span>Operator Credentials</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="font-sans text-sm sm:text-base text-slate-400 mt-1 font-normal">
          Manage your operator identity, profile information, and storage details.
        </p>
      </div>

      {/* ── Profile Identity Card ────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/10 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-display font-black text-3xl shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              {user?.name}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-slate-400">
              {user?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                ● ACTIVE OPERATOR
              </span>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Member since {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Operator Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900/80 transition-all font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              disabled
              className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-500 cursor-not-allowed font-mono"
            />
            <span className="text-[11px] text-slate-500">
              Email address is permanently bound to your operator node.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Operator Bio / Description
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
              maxLength={300}
              placeholder="Tell others about your video projects..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900/80 transition-all font-sans resize-none"
            />
            <span className="text-[11px] font-mono text-slate-500">
              {formData.bio.length}/300 characters
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-sm font-bold transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Preferences</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
