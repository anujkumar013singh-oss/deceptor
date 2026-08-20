import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  User,
  Upload,
  Clock,
  Sparkles,
  Home,
  Shield,
  Layers,
  ChevronRight,
  Radio,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#features');
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isPanel = location.pathname.startsWith('/panel');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['features', 'how-it-works', 'comparison-section', 'testimonials-section'];
      const scrollPosition = window.scrollY + 140;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const navLinks = isAuthenticated
    ? [
        { href: '/panel/upload', label: 'Upload Video', icon: Upload, description: 'Host videos up to 3 hours' },
        { href: '/panel/history', label: 'My Video Library', icon: Clock, description: 'Manage permanent links' },
      ]
    : [
        { href: '#features', label: 'Features', icon: Zap, description: 'Lossless video hosting engine' },
        { href: '#how-it-works', label: 'How It Works', icon: Layers, description: '3-step instant workflow' },
        { href: '#comparison-section', label: 'Comparison', icon: Shield, description: 'Deceptor vs competitors' },
        { href: '#testimonials-section', label: 'Reviews', icon: Sparkles, description: 'Creator experiences' },
      ];

  return (
    <>
      <header className="fixed top-3 sm:top-6 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none">
        {/* ── Main Glassmorphic Navigation Island ── */}
        <nav
          className={cn(
            'pointer-events-auto max-w-5xl mx-auto rounded-2xl sm:rounded-full transition-all duration-300 ease-out',
            'bg-slate-950/80 backdrop-blur-2xl backdrop-saturate-200',
            'border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),inset_0_1px_1px_0_rgba(255,255,255,0.2)]',
            'px-3.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between',
            scrolled ? 'shadow-[0_12px_40px_0_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.25)] border-cyan-500/30' : ''
          )}
        >
          {/* Brand / Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-blue-500/10 border border-cyan-400/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300">
              <img
                src="/logo.svg"
                alt="Deceptor Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              />
            </div>
            <span className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              Deceptor
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 shadow-inner">
            {navLinks.map((link) => {
              const isRoute = link.href.startsWith('/');
              const isActive = isRoute
                ? location.pathname === link.href
                : activeSection === link.href;

              return isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200',
                    isActive
                      ? 'text-white bg-blue-600/40 border border-blue-400/40 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200',
                    isActive
                      ? 'text-white bg-blue-600/40 border border-blue-400/40 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-white/[0.05] p-1 pr-2.5 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  {user?.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-cyan-400"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">
                    {user?.name || 'Operator'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.08] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="relative group overflow-hidden rounded-full p-[1px] transition-all duration-300 hover:scale-105"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full animate-gradient" />
                  <span className="relative flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-950/90 text-xs font-bold text-white transition-all group-hover:bg-transparent">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    <span>Get Started Free</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right: Quick Actions & Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
              >
                Get Started
              </Link>
            ) : (
              <Link
                to="/panel/upload"
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-200 hover:text-white bg-white/[0.08] border border-white/15 active:scale-95 transition-all"
              aria-label="Toggle Mobile Menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* ── Mobile Specialized Cyber Drawer (Enhanced Mobile Visuals & Typography) ── */}
        {mobileOpen && (
          <div className="pointer-events-auto md:hidden mt-2 max-w-5xl mx-auto rounded-3xl bg-slate-950/95 backdrop-blur-3xl border border-cyan-500/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-fadeIn space-y-5">
            {/* Mobile Header Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Universal Stream Console
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ● 4K CDN ONLINE
              </span>
            </div>

            {/* Authenticated User Identity Hero (Mobile) */}
            {isAuthenticated && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user?.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover border border-cyan-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-base font-bold shadow-md">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-display text-sm font-bold text-white leading-tight">
                      {user?.name || 'Active Operator'}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            )}

            {/* Mobile Navigation List with Enhanced Typography */}
            <div className="grid grid-cols-1 gap-2">
              {navLinks.map((link) => {
                const isRoute = link.href.startsWith('/');
                const IconComponent = link.icon || Layers;
                const isActive = isRoute
                  ? location.pathname === link.href
                  : activeSection === link.href;

                const linkContent = (
                  <div
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200',
                      isActive
                        ? 'bg-blue-600/20 border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center',
                          isActive ? 'bg-cyan-500 text-black shadow-md' : 'bg-white/10 text-cyan-300'
                        )}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-display text-base font-bold text-white">
                          {link.label}
                        </div>
                        {link.description && (
                          <div className="text-xs text-slate-400">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4', isActive ? 'text-cyan-300' : 'text-slate-500')} />
                  </div>
                );

                return isRoute ? (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                    {linkContent}
                  </Link>
                ) : (
                  <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    {linkContent}
                  </a>
                );
              })}
            </div>

            {/* Mobile Bottom Auth Buttons */}
            {!isAuthenticated && (
              <div className="pt-2 grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 rounded-2xl bg-white/[0.06] border border-white/15 text-center text-sm font-bold text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-center text-sm font-bold text-white shadow-lg shadow-cyan-500/25"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Mobile Floating Bottom Cyber-Dock (Dedicated Thumb Navigation) ── */}
      <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto flex items-center justify-around gap-1 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-w-xs w-full">
          <Link
            to="/"
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
              location.pathname === '/' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            )}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/panel/upload"
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
                  location.pathname === '/panel/upload'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Upload className="w-4 h-4" />
                <span className="text-[10px]">Upload</span>
              </Link>
              <Link
                to="/panel/history"
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
                  location.pathname === '/panel/history'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Clock className="w-4 h-4" />
                <span className="text-[10px]">Videos</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
                  location.pathname === '/login' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                )}
              >
                <User className="w-4 h-4" />
                <span className="text-[10px]">Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-cyan-300 font-bold bg-gradient-to-r from-blue-600/30 to-cyan-500/30 border border-cyan-400/40"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px]">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
