import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, User, Upload, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#features');
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

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

  const handleLogout = () => {
    logout();
  };

  const navLinks = isAuthenticated
    ? [
        { href: '/panel/upload', label: 'Upload', icon: Upload },
        { href: '/panel/history', label: 'My Videos', icon: Clock },
        { href: '/panel/profile', label: 'Profile', icon: User },
      ]
    : [
        { href: '#features', label: 'Features' },
        { href: '#how-it-works', label: 'How It Works' },
        { href: '#comparison-section', label: 'Comparison' },
        { href: '#testimonials-section', label: 'Reviews' },
      ];

  return (
    <header className="fixed top-4 sm:top-6 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none">
      {/* ── Single Unified Glassmorphic Island Container ── */}
      <nav
        className={cn(
          'pointer-events-auto max-w-5xl mx-auto rounded-full transition-all duration-500 ease-out',
          'bg-slate-950/60 backdrop-blur-2xl backdrop-saturate-200',
          'border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.2)]',
          'px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between',
          scrolled ? 'shadow-[0_12px_40px_0_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.25)] border-white/20' : ''
        )}
      >
        {/* Left: Brand / Logo with Transparent Vector Icon */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-cyan-400/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300">
            <img
              src="/logo.svg"
              alt="Deceptor Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
            />
          </div>
          <span className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
            Deceptor
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </span>
        </Link>

        {/* Center: Single Integrated Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 shadow-inner">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300',
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

        {/* Right: Actions (Sign In / Register / Profile) */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-white/[0.05] p-1 pr-2 rounded-full border border-white/10">
              <Link to="/panel/profile" className="flex items-center gap-2">
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
                <span className="text-xs font-semibold text-white max-w-[100px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>
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
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-full hover:bg-white/[0.08] transition-all"
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
                  <span>Get Started</span>
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-full text-slate-300 hover:text-white bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {/* ── Mobile Glass Dropdown ── */}
      {mobileOpen && (
        <div className="pointer-events-auto md:hidden mt-2 max-w-5xl mx-auto rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 mt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-center text-slate-300 hover:bg-white/[0.08] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary text-xs w-full py-2.5 rounded-xl text-center font-bold"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
