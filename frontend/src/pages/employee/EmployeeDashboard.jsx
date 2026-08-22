import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { attendanceApi } from '../../api/attendanceApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar, DollarSign, Activity, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getEmployeeDashboard();
      setData(res);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMsg('');
    try {
      await attendanceApi.checkIn();
      setMsg('Checked in successfully!');
      await fetchDashboard();
    } catch (err) {
      setMsg(err || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMsg('');
    try {
      await attendanceApi.checkOut();
      setMsg('Checked out successfully!');
      await fetchDashboard();
    } catch (err) {
      setMsg(err || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading employee portal...
      </div>
    );
  }

  const profile = data?.profile;
  const todayAtt = data?.today_attendance;
  const balance = data?.leave_balance;
  const activity = data?.activity_feed || [];

  const isCheckedIn = !!todayAtt?.check_in;
  const isCheckedOut = !!todayAtt?.check_out;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <span>{profile?.job_details?.department || 'Department'}</span> • <span>{profile?.job_details?.designation || 'Team Member'}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.personal_details?.full_name || 'Employee'}! 👋
            </h1>
            <p className="text-brand-100 text-sm mt-1">
              Employee ID: <span className="font-semibold">{profile?.employee_id}</span>
            </p>
          </div>

          {/* Today's Check-in / Check-out Action Card */}
          <div className="glass-panel p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white min-w-[280px]">
            <div className="text-xs font-bold text-brand-100 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Today's Work Log</span>
              {todayAtt ? <StatusBadge status={todayAtt.status} /> : <span className="text-xs font-normal">Not checked in</span>}
            </div>

            {msg && (
              <div className="mb-2 text-xs font-semibold px-2.5 py-1 rounded bg-white/20 text-white flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {msg}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-3">
              {!isCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-brand-50 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Check In Now
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-md hover:bg-rose-600 flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Check Out
                </button>
              ) : (
                <div className="w-full py-2 text-center text-xs font-bold text-emerald-200 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Work log completed ({todayAtt.work_hours} hrs)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance & Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Paid Leave Balance" subtitle="Annual allotted allowance">
          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{balance?.paid_remaining ?? 15}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Days Remaining out of {balance?.paid_allotted ?? 15}</div>
            </div>
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Used: {balance?.paid_used ?? 0} days</span>
            <Link to="/leave" className="text-brand-600 dark:text-brand-400 hover:underline">Apply Leave →</Link>
          </div>
        </Card>

        <Card title="Sick Leave Allowance" subtitle="Health & medical coverage">
          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{balance?.sick_remaining ?? 10}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Days Remaining out of {balance?.sick_allotted ?? 10}</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Used: {balance?.sick_used ?? 0} days</span>
            <Link to="/leave" className="text-amber-600 dark:text-amber-400 hover:underline">View Policy →</Link>
          </div>
        </Card>

        <Card title="Unpaid Leave Taken" subtitle="Affects monthly payroll math">
          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">{balance?.unpaid_used ?? 0}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Unpaid Days This Year</div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Per-day deduction rate applies</span>
            <Link to="/payroll" className="text-rose-600 dark:text-rose-400 hover:underline">View Paystubs →</Link>
          </div>
        </Card>
      </div>

      {/* Activity Timeline & Pending Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity Feed" subtitle="Audit trail of your HR requests">
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No recent activity recorded.</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {activity.map((act) => (
                <div key={act._id || act.id} className="flex items-start gap-3 text-sm pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0"></div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{act.message}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Pending Leave Requests" subtitle="Awaiting HR / Admin review">
          {data?.pending_leaves?.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              No pending leave requests. All clear!
            </div>
          ) : (
            <div className="space-y-3">
              {data?.pending_leaves?.map((req) => (
                <div key={req._id || req.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase">{req.leave_type} Leave</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {req.start_date} to {req.end_date} ({req.days_count} days)
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
