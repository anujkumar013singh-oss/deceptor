import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff, Check } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { validatePassword, getPasswordStrength } from '../lib/utils';
import toast from 'react-hot-toast';
import AuthCanvas from '../components/AuthCanvas';

const STEPS = ['Enter Email', 'Verify Code', 'New Password'];

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=new-password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address.');

    // Immediate 0ms UI transition
    setStep(1);
    setTimer(60);
    toast.success('Password reset code dispatched! Check your email.');

    try {
      await api.post('/auth/forgot-password/request-otp', { email });
    } catch (err) {
      setStep(0);
      toast.error(err.message || 'No account found with this email.');
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Please enter the complete 6-digit code.');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify-otp', { email, code });
      toast.success('Code verified successfully.');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = validatePassword(password);
    if (errors.length > 0) return toast.error(`Password requirements: ${errors.join(', ')}`);
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/reset', { email, password, confirmPassword });
      login(res.data.user, res.data.token);
      toast.success('Password reset successfully! Welcome back 🎉');
      navigate('/panel/upload');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);
  const sv = { enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

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
            <h2 className="text-3xl lg:text-5xl font-light tracking-tight text-white mb-4 leading-[1.1]">
              Recover Your<br />Account Access.
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed font-light">
              Follow 3 quick steps to verify your email and set a new password for your video hosting account.
            </p>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-800/60">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-cyan-400 font-bold shadow-lg">
                  4K
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-emerald-400 font-bold shadow-lg">
                  3H
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-purple-400 font-bold shadow-lg">
                  ∞
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-200 font-medium">
                  Quick Email OTP
                </span>
                <span className="text-xs text-slate-500 font-light">
                  Instant Account Recovery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Panel: Simple, Clean Form ────────────────────────────── */}
        <section className="w-full lg:w-7/12 flex-grow flex items-center justify-center p-6 sm:p-12 lg:p-20 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Step Pipeline Progress Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
              {STEPS.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                      idx < step
                        ? 'bg-emerald-500 text-black font-bold'
                        : idx === step
                        ? 'border border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'border border-slate-800 text-slate-600'
                    }`}
                  >
                    {idx < step ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline-block ${
                      idx === step ? 'text-slate-100 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ── STEP 0: Email Request ─────────────────────────────────── */}
              {step === 0 && (
                <motion.div
                  key="s0"
                  variants={sv}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl font-normal tracking-tight text-white">Forgot Your Password?</h1>
                    <p className="text-sm text-slate-400 font-light">
                      Enter your registered email address and we'll send you a verification code to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleRequestOTP} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:bg-slate-900/70 transition-all placeholder-slate-600"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white hover:bg-slate-200 text-black text-sm font-semibold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <span>Sending Reset Code...</span>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 1: Verify OTP ────────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  variants={sv}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                  </button>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-normal tracking-tight text-white">Enter Verification Code</h1>
                    <p className="text-sm text-slate-400 font-light">
                      We sent a 6-digit code to <span className="text-white font-medium">{email}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="flex gap-2 justify-between" onPaste={handleOTPPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(i, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(i, e)}
                          className="w-12 sm:w-14 h-14 text-center bg-slate-900/50 border border-slate-800 focus:border-amber-400 focus:bg-slate-900/80 rounded-lg text-xl text-white font-mono font-bold outline-none transition-all"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white hover:bg-slate-200 text-black text-sm font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <span>Verifying Code...</span>
                      ) : (
                        <>
                          <span>Verify Code & Continue</span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                      <span>Didn't get the code?</span>
                      {timer > 0 ? (
                        <span className="text-amber-400 font-mono">Resend in {timer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          className="text-white hover:text-amber-300 font-medium transition-colors"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 2: Set New Password ──────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  variants={sv}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl font-normal tracking-tight text-white">Set a New Password</h1>
                    <p className="text-sm text-slate-400 font-light">
                      Choose a new secure password for your account.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/40 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:bg-slate-900/70 transition-all placeholder-slate-600"
                            placeholder="At least 8 characters, 1 uppercase, 1 number"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {password && (
                          <div className="pt-2">
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-300"
                                style={{ width: strength.width, backgroundColor: strength.color }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 mt-1 block">
                              Password Strength: <span style={{ color: strength.color }} className="font-semibold">{strength.label}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-900/40 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:bg-slate-900/70 transition-all placeholder-slate-600"
                            placeholder="Re-enter your new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white hover:bg-slate-200 text-black text-sm font-semibold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <span>Updating Password...</span>
                      ) : (
                        <>
                          <span>Save & Sign In</span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

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
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-300 hover:text-white py-2 px-4 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <span>Remember your password?</span>
                <span className="text-cyan-400 font-bold underline underline-offset-4">Return to Login</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </section>
  );
};

export default ForgotPasswordPage;
