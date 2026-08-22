import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { role, employeeId, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const fullName = userProfile?.personal_details?.full_name || employeeId || 'User';
  const avatarUrl = userProfile?.personal_details?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0c8de4&color=fff`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-9 h-9 rounded-full object-cover border-2 border-brand-500/30 shadow-sm"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0c8de4&color=fff`;
          }}
        />
        <div className="hidden md:block text-left">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{fullName}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{employeeId}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            <span className="capitalize font-semibold text-brand-600 dark:text-brand-400">{role}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{fullName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile?.email}</div>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleNavigate('/employee/profile')}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 font-medium transition-colors"
            >
              <User className="w-4 h-4 text-brand-500" />
              My Profile
            </button>
            {role === 'admin' && (
              <button
                onClick={() => handleNavigate('/admin/dashboard')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Admin HR Command Center
              </button>
            )}
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
