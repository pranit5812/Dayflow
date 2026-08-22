import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Users, UserCheck, Clock, CheckSquare, TrendingUp, AlertCircle, Shield } from 'lucide-react';
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
    return <div className="p-8 text-center text-slate-500">Loading HR Admin overview...</div>;
  }

  const metrics = data?.metrics || {};
  const pendingRequests = data?.pending_requests || [];
  const deptDist = data?.department_distribution || [];
  const activity = data?.recent_activity || [];

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-purple-900 via-slate-900 to-brand-950 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-3">
              <Shield className="w-3.5 h-3.5" /> HR Command Center
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Organization Overview</h1>
            <p className="text-slate-300 text-sm mt-1">Live metrics across employee profiles, attendance, leaves, and payroll</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/leave"
              className="py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Approvals ({metrics.pending_leave_count ?? 0})
            </Link>
            <Link
              to="/admin/payroll"
              className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/30 transition-all"
            >
              Payroll Engine
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="!p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Staff</span>
            <Users className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics.total_employees}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {metrics.active_employees} active employees
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Attendance</span>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics.attendance_percentage}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.present_today} checked in today
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Approvals</span>
            <CheckSquare className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{metrics.pending_leave_count}</div>
          <div className="text-xs text-slate-500 mt-1">
            Requires HR action
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Departments</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">{deptDist.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            Active teams
          </div>
        </Card>
      </div>

      {/* Pending Leave Approvals & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          title="Pending Leave Requests" 
          subtitle="Click to review and trigger attendance auto-sync"
          action={
            <Link to="/admin/leave" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              View All →
            </Link>
          }
        >
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              All leave requests are up to date!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req._id || req.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {req.employee_name || req.employee_id}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="uppercase font-semibold text-brand-600 dark:text-brand-400">{req.leave_type}</span> ({req.start_date} to {req.end_date})
                    </div>
                  </div>
                  <Link
                    to="/admin/leave"
                    className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Activity Feed */}
        <Card title="Organization Activity Stream" subtitle="Audit trail across all modules">
          {activity.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No activity recorded.</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {activity.map((act) => (
                <div key={act._id || act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{act.employee_name || act.employee_id}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{act.message}</div>
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
