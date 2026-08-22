import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Lock, Mail, User, BadgeCheck, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, Clock, DollarSign, Calendar, FileSpreadsheet } from 'lucide-react';

const heroSlides = [
  {
    icon: Clock,
    color: 'from-emerald-500 to-teal-400',
    title: 'Self-Service Employee Portal',
    subtitle: 'Manage your attendance, view work hours, and request leaves anytime.',
    badge: 'Employee Hub'
  },
  {
    icon: DollarSign,
    color: 'from-brand-500 to-sky-400',
    title: 'Automated Salary Slips & PDF',
    subtitle: 'Access monthly earnings breakdown, gross wages, and download official PDF paystubs.',
    badge: 'Payslip Portal'
  },
  {
    icon: Calendar,
    color: 'from-purple-500 to-indigo-400',
    title: 'Festive & Public Holidays',
    subtitle: '8+ company public holidays pre-loaded and auto-synced with calendar.',
    badge: 'Paid Holidays'
  }
];

export const SignUp = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic Carousel State
  const [activeSlide, setActiveSlide] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.signup({
        employee_id: employeeId,
        full_name: fullName,
        email,
        password,
        role
      });
      setSuccess('Account created successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = heroSlides[activeSlide].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Floating Animated Ambient Glow Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sky-500/20 blur-[120px] pointer-events-none animate-pulse"></div>

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
                <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">Employee Onboarding</p>
              </div>
            </div>

            {/* Dynamic Card */}
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

              {/* Carousel Indicators */}
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

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-emerald-400">Fast Registration</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Instant Setup</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-brand-400">Secure AES</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Encrypted</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-base font-black text-purple-400">2 Roles</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Employee / Admin</div>
            </div>
          </div>
        </div>

        {/* Right Side: High-Contrast Auth Form Card */}
        <div className="lg:col-span-6 w-full">
          <div className="rounded-3xl p-8 shadow-2xl border border-slate-800 bg-slate-900 text-white backdrop-blur-2xl">
            {/* Mobile Banner */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/30 mb-2">
                D
              </div>
              <h1 className="text-2xl font-black text-white">Dayflow HRMS</h1>
              <p className="text-xs text-slate-400">Employee Self-Registration Portal</p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Create New Account</h2>
              <p className="text-xs text-slate-400 mt-1">Register your profile to get started with Dayflow</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Employee ID (Optional / Auto-Generated)
                </label>
                <div className="relative">
                  <BadgeCheck className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP1005 (Leave blank to auto-generate)"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
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

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Portal Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-semibold"
                >
                  <option value="employee">Employee Profile</option>
                  <option value="admin">HR Admin Profile</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white font-extrabold text-sm shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Registering Account...' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 font-bold hover:underline">
                Sign In ➔
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
