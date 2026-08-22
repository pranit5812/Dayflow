import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Users, UserCheck, Clock, CheckSquare, TrendingUp, AlertCircle, Shield, ArrowRight, DollarSign, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const res = await dashboardApi.getAdminDashboard();
        setData(res);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          Synchronizing HR Command Center...
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const pendingRequests = data?.pending_requests || [];
  const deptDist = data?.department_distribution || [];
  const activity = data?.recent_activity || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Admin HR Command Center Header Banner */}
      <div className="relative rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 text-white overflow-hidden shadow-2xl">
        {/* Ambient Decorative Glow Effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase tracking-wider mb-3">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>HR Command Center</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">Organization Overview</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
              Live metrics across employee profiles, attendance logs, leave requests, and payroll engines.
            </p>
          </div>

          {/* Quick Command Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/time-off"
              className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Pending Leaves ({metrics.pending_leave_count ?? 0})
            </Link>
            <Link
              to="/admin/payroll"
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Payroll Engine
            </Link>
            <Link
              to="/admin/reports"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Workforce */}
        <Card className="!p-5 border-t-4 border-t-indigo-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics.total_employees ?? 0}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {metrics.active_employees ?? 0} active employee profiles
          </div>
        </Card>

        {/* Attendance Rate */}
        <Card className="!p-5 border-t-4 border-t-emerald-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics.attendance_percentage ?? 0}%</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.attendance_percentage ?? 0)}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.present_today ?? 0} employees checked in today
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="!p-5 border-t-4 border-t-amber-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{metrics.pending_leave_count ?? 0}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
            Requires HR approval action
          </div>
        </Card>

        {/* Departments */}
        <Card className="!p-5 border-t-4 border-t-purple-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Departments</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">{deptDist.length || 4}</div>
          <div className="text-xs text-slate-500 mt-1">
            Across engineering, HR & sales
          </div>
        </Card>
      </div>

      {/* Pending Approvals & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Applications */}
        <Card 
          title="Pending Leave Applications" 
          subtitle="Review employee time-off requests & trigger attendance updates"
          action={
            <Link to="/admin/time-off" className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View Approvals Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {pendingRequests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-semibold">
              ✨ All leave applications have been reviewed!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req._id || req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {req.employee_name || req.employee_id}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">{req.leave_type}</span> ({req.start_date} to {req.end_date})
                    </div>
                  </div>
                  <Link
                    to="/admin/time-off"
                    className="py-1.5 px-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
                  >
                    Review Request
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Live Organization Audit Stream */}
        <Card title="Organization Activity Audit Stream" subtitle="Live system events across attendance, leaves & payroll">
          {activity.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-semibold">No recent activity logged.</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {activity.map((act) => (
                <div key={act._id || act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{act.employee_name || act.employee_id}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{act.message}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(act.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
