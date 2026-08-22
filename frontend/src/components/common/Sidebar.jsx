import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { 
  User, Clock, Calendar, DollarSign, Users, 
  LayoutDashboard, BarChart3, Shield, Mail, ExternalLink, 
  Headphones, PhoneCall, ChevronRight, UserCheck, Briefcase, Building2,
  Phone, AlertTriangle, ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);

  const employeeLinks = [
    { to: '/employee/profile', label: 'My Profile', icon: User },
    { to: '/employee/attendance', label: 'Attendance', icon: Clock },
    { to: '/employee/time-off', label: 'Time Off', icon: Calendar },
    { to: '/employee/payroll', label: 'Payroll', icon: DollarSign },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/attendance', label: 'Attendance', icon: Clock },
    { to: '/admin/time-off', label: 'Time Off Approvals', icon: Calendar },
    { to: '/admin/payroll', label: 'Payroll Engine', icon: DollarSign },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ];

  const emailDirectory = [
    {
      title: 'HR Department',
      email: 'hr@dayflow.com',
      icon: UserCheck,
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/60',
      subject: 'HR Support & Help Request'
    },
    {
      title: 'Reporting Manager',
      email: 'manager@dayflow.com',
      icon: Briefcase,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
      subject: 'Manager Consultation Inquiry'
    },
    {
      title: 'Head of Department (HoD)',
      email: 'hod@dayflow.com',
      icon: Building2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
      subject: 'Department Head Escalation'
    }
  ];

  const landlineDirectory = [
    {
      title: 'HR General Helpdesk',
      number: '+1 (800) 555-0199',
      ext: 'Ext: 104 / 022-4988-1200',
      icon: PhoneCall,
      color: 'text-sky-500'
    },
    {
      title: 'IT & Portal Support Desk',
      number: '+1 (800) 555-0144',
      ext: 'Ext: 108 / 022-4988-1201',
      icon: Headphones,
      color: 'text-indigo-500'
    },
    {
      title: 'Office Emergency & Security',
      number: '+1 (800) 555-0191',
      ext: '24/7 Security Desk',
      icon: ShieldCheck,
      color: 'text-rose-500'
    }
  ];

  const getGmailUrl = (email, subject) => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  return (
    <>
      <aside className="w-64 shrink-0 glass-panel border-r border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
        <div className="space-y-6">
          {/* Self Service Section */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
              Self Service
            </div>
            <nav className="space-y-1">
              {employeeLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink key={link.to} to={link.to} className={linkClass}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* HR Management Admin Section */}
          {role === 'admin' && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  HR Management
                </span>
                <Shield className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <nav className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink key={link.to} to={link.to} className={linkClass}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Section: Clickable Support Desk Button above Dayflow Footer */}
        <div>
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-full mb-3 p-3 rounded-xl bg-gradient-to-r from-brand-500/10 via-sky-500/10 to-purple-500/10 hover:from-brand-500/20 hover:to-sky-500/20 border border-brand-500/30 text-left transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-500 text-white shadow-md shadow-brand-500/30">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Help & Support Desk</div>
                <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">Emails & Office Landlines</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Footer Badge */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400">Dayflow HRMS</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Excalidraw Engine Active</div>
          </div>
        </div>
      </aside>

      {/* Support & Directory Modal */}
      <Modal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} title="Help & Support Directory">
        <div className="space-y-6">
          {/* Email Section */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-500" /> Executive & HR Email Directory (Direct Gmail)
            </div>
            <div className="space-y-2">
              {emailDirectory.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={idx}
                    href={getGmailUrl(item.email, item.subject)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 opacity-90 group-hover:opacity-100">
                      <span>Compose in Gmail</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Landline Section */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" /> Office Landlines & Helpline Desk
            </div>
            <div className="space-y-2">
              {landlineDirectory.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={idx}
                    href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}
                    className="group p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500/50 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.ext}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">
                        {item.number}
                      </div>
                      <div className="text-[10px] text-slate-400">Click to dial</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
