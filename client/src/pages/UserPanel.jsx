import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Upload,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  HardDrive,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/panel/upload', label: 'Upload Video', icon: Upload, desc: 'Host new video' },
  { path: '/panel/history', label: 'Video Library', icon: Clock, desc: 'Manage universal links' },
];

const UserPanel = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#03060f] text-slate-100 antialiased flex flex-col lg:flex-row relative selection:bg-cyan-500 selection:text-black font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Ambient Glows & Grid Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%202%202%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')",
            backgroundSize: '3px 3px',
          }}
        />
      </div>

      {/* ── Desktop Floating Glass Sidebar (Left) ────────────────────────── */}
      <aside className="hidden lg:flex w-72 flex-col justify-between p-6 bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 relative z-20 flex-shrink-0">
        {/* Top Logo & Platform Badge */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-cyan-400/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
                <img src="/logo.svg" alt="Deceptor" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-black text-xl text-white tracking-tight">
                Deceptor
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
              CONSOLE
            </span>
          </div>

          {/* User Quick Identity Pill */}
          <div className="mt-6 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-display font-extrabold text-sm shadow-md">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user?.name}</span>
              <span className="text-xs text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group',
                    active
                      ? 'bg-blue-600/30 text-white border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                      active ? 'bg-cyan-400 text-black' : 'bg-slate-900 text-slate-400 group-hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Stats & Logout */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-950/80 border border-blue-500/20 shadow-inner">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <HardDrive className="w-3.5 h-3.5" /> High-Speed Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Universal permanent links are active with original bitrate streaming.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ────────────────────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-5 h-16 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Deceptor" className="w-7 h-7 object-contain" />
          <span className="font-display font-black text-lg text-white">Deceptor</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/panel/upload"
            className="px-3 py-1.5 rounded-full bg-cyan-400 text-black text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#03060f]/95 backdrop-blur-3xl p-6 flex flex-col justify-between animate-fadeIn border-b border-white/10">
          <nav className="space-y-3">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-2xl text-base font-medium',
                    active ? 'bg-blue-600/30 text-white border border-cyan-400' : 'text-slate-400 bg-white/[0.03]'
                  )}
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* ── Main Content Area (Outlet) ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-screen relative z-10 p-4 sm:p-8 lg:p-12">
        <Outlet />
      </main>
    </div>
  );
};

export default UserPanel;
