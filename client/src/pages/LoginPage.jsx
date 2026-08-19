import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import AuthCanvas from '../components/AuthCanvas';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintainLink, setMaintainLink] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter your email and password.');

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 👋`);
      navigate('/panel/upload');
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="bg-[#020202] text-slate-300 antialiased min-h-screen flex flex-col selection:bg-slate-200 selection:text-black relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Micro-grid overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%202%202%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')",
          backgroundSize: '2px 2px',
        }}
      />

      <main className="flex flex-col lg:flex-row w-full min-h-screen relative z-30">
        {/* ── Left Panel: Context & Visualization ────────────────────────── */}
        <section className="relative w-full lg:w-5/12 min-h-[40vh] lg:min-h-screen flex flex-col justify-between p-8 lg:p-14 bg-black border-b lg:border-b-0 lg:border-r border-slate-900 overflow-hidden">
          {/* Animated Interactive Flow Canvas */}
          <AuthCanvas />

          {/* Header Identity */}
          <div className="relative z-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm group-hover:border-cyan-500/50 transition-colors p-1.5">
                <img src="/logo.svg" alt="Deceptor" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-semibold tracking-wider text-white">
                Deceptor
              </span>
            </Link>
          </div>

          {/* Contextual Information */}
          <div className="relative z-20 mt-16 lg:mt-0">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 uppercase leading-[1.05]">
              Welcome Back<br />to Deceptor.
            </h2>
            <p className="font-sans text-sm sm:text-base text-slate-300 max-w-sm mb-8 leading-relaxed font-normal">
              Sign in to manage your uploaded videos, track real-time stream telemetry, and share permanent universal links.
            </p>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-800/60">
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-display text-cyan-400 font-extrabold shadow-lg">
                  4K
                </div>
                <div className="w-9 h-9 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-display text-emerald-400 font-extrabold shadow-lg">
                  3H
                </div>
                <div className="w-9 h-9 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-display text-purple-400 font-extrabold shadow-lg">
                  ∞
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-white font-semibold uppercase tracking-wider">
                  Lossless Playback
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Global Fast CDN Storage
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Panel: Simple, Clean Form ────────────────────────────── */}
        <section className="w-full lg:w-7/12 flex-grow flex items-center justify-center p-6 sm:p-12 lg:p-20 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Form Header */}
            <div className="space-y-2">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Sign In to Deceptor
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-300 font-normal">
                Enter your email address and password to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Text Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900/80 transition-all placeholder-slate-500 font-sans"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-200 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900/80 transition-all placeholder-slate-500 font-sans"
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Keep me signed in */}
              <div className="flex items-center justify-between py-2 border-y border-slate-800/40">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">
                    Keep me signed in
                  </span>
                  <span className="text-xs text-slate-500 font-light">
                    Stay logged in on this browser
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintainLink(!maintainLink)}
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    maintainLink ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      maintainLink ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-200 text-black text-sm font-semibold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-800/60" />
              <span className="flex-shrink-0 px-4 text-xs text-slate-500 font-medium">
                or
              </span>
              <div className="flex-grow border-t border-slate-800/60" />
            </div>

            {/* Secondary Actions */}
            <div className="text-center pt-1">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-300 hover:text-white py-2 px-4 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <span>Don't have an account?</span>
                <span className="text-cyan-400 font-bold underline underline-offset-4">Create One Free</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </section>
  );
};

export default LoginPage;
