import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { Sun, Moon, Clock, Calendar, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { role, theme, toggleTheme } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-6">
        {/* Company Logo */}
        <Link to={role === 'admin' ? '/admin/dashboard' : '/employee/profile'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            D
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Dayflow
            </span>
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
              HRMS
            </span>
          </div>
        </Link>
      </div>

      {/* Live Date & Real-time Digital Clock Widget */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
        <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
        <span>{formattedDate}</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
        <span className="text-emerald-600 dark:text-emerald-400 font-black">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Pill */}
        <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
          role === 'admin'
            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
            : 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800'
        }`}>
          <ShieldCheck className="w-3 h-3" />
          {role === 'admin' ? 'HR Admin' : 'Employee'}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};
