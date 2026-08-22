import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { Modal } from '../../components/common/Modal';
import { Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, KeyRound, AlertCircle, Clock, DollarSign, Calendar, FileSpreadsheet } from 'lucide-react';

const heroSlides = [
  {
    icon: Clock,
    color: 'from-emerald-500 to-teal-400',
    title: 'Daily Attendance Logger',
    subtitle: 'Check in daily, log work hours, and view color-coded monthly calendar highlights.',
    badge: 'Real-time Auto-Sync'
  },
  {
    icon: DollarSign,
    color: 'from-brand-500 to-sky-400',
    title: 'Role-Based Payroll Engine',
    subtitle: 'Fixed numerical disbursement dates assigned per role tier with HR editability.',
    badge: '100% Accuracy'
  },
  {
    icon: Calendar,
    color: 'from-purple-500 to-indigo-400',
    title: 'Time Off & Leave Management',
    subtitle: 'Submit leave applications, track balances, and view HR review remarks.',
    badge: 'Festive Holidays Synced'
  },
  {
    icon: FileSpreadsheet,
    color: 'from-rose-500 to-amber-400',
    title: 'Excel CSV Export Engine',
    subtitle: 'Export audit logs formatted with UTF-8 BOM for Microsoft Excel.',
    badge: 'Audit Statements'
  }
];

export const SignIn = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic Hero Carousel Index
  const [activeSlide, setActiveSlide] = useState(0);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email/ID, 2 = Enter OTP & New Password
  const [forgotId, setForgotId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-rotate dynamic hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginId, password);
      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/profile');
      }
    } catch (err) {
      setError(err || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotId(loginId || '');
    setOtpCode('');
    setNewPassword('');
    setForgotMsg('');
    setForgotError('');
    setForgotStep(1);
    setIsForgotModalOpen(true);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotId.trim()) {
      setForgotError('Please enter your Work Email or Employee ID.');
      return;
    }
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);

    try {
      const res = await authApi.forgotPassword(forgotId.trim());
      setGeneratedOtp(res.otp_code || '');
      setForgotMsg(`OTP verification code generated! Verification Code: ${res.otp_code}`);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err || 'Failed to generate reset OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword.trim()) {
      setForgotError('Please enter both OTP code and new password.');
      return;
    }
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);

    try {
      const res = await authApi.resetPassword(forgotId.trim(), otpCode.trim(), newPassword.trim());
      setForgotMsg(res.message || 'Password updated successfully!');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setPassword(newPassword);
      }, 1800);
    } catch (err) {
      setForgotError(err || 'Failed to reset password. Check your OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const CurrentIcon = heroSlides[activeSlide].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Floating Animated Background Glow Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/20 blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side (Desktop): Dynamic Showcase Hero Banner */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 p-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/30">
                D
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Dayflow HRMS</h1>
                <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">Human Resource Engine</p>
              </div>
            </div>

            {/* Dynamic Rotating Card */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${heroSlides[activeSlide].color} text-white shadow-md`}>
                  <CurrentIcon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                  ✨ {heroSlides[activeSlide].badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{heroSlides[activeSlide].title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{heroSlides[activeSlide].subtitle}</p>
              </div>

              {/* Carousel Dots */}
              <div className="flex items-center gap-2 pt-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeSlide ? 'w-6 bg-brand-400' : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live System Stat Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-emerald-400">99.9%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Uptime</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-brand-400">8+ Days</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Festive Holidays</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-purple-400">100%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Excel Sync</div>
            </div>
          </div>
        </div>

        {/* Right Side: High-Contrast Auth Card */}
        <div className="lg:col-span-6 w-full">
          <div className="rounded-3xl p-8 shadow-2xl border border-slate-800 bg-slate-900 text-white backdrop-blur-2xl">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/30 mb-2">
                D
              </div>
              <h1 className="text-2xl font-black text-white">Dayflow HRMS</h1>
              <p className="text-xs text-slate-400">Human Resource Management Portal</p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your Dayflow workspace</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Work Email Address or Employee ID
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="name@company.com or EMP1001"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white font-extrabold text-sm shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-400 font-bold hover:underline">
                Create New Account ➔
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset Account Password">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {forgotStep === 1
              ? "Enter your registered Work Email or Employee ID. We will generate a secure OTP code to verify your identity."
              : "Enter the OTP verification code and set your new account password."}
          </p>

          {forgotError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {forgotError}
            </div>
          )}

          {forgotMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> {forgotMsg}
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Work Email Address or Employee ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="name@company.com or EMP1001"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Generating OTP...' : 'Send Reset Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  6-Digit OTP Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="text-xs font-bold text-slate-500 hover:underline"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
