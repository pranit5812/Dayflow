import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar, CheckCircle2, LogIn, LogOut, AlertCircle } from 'lucide-react';

export const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [histRes, todayRes] = await Promise.all([
        attendanceApi.getMyHistory(month),
        attendanceApi.getToday()
      ]);
      setRecords(histRes);
      setTodayAtt(todayRes);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMsg('');
    try {
      await attendanceApi.checkIn();
      setMsg('Checked in successfully!');
      await fetchAttendance();
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
      await fetchAttendance();
    } catch (err) {
      setMsg(err || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = !!todayAtt?.check_in;
  const isCheckedOut = !!todayAtt?.check_out;

  // Aggregate stats
  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'Present').length;
  const halfDays = records.filter(r => r.status === 'Half-day').length;
  const leaveDays = records.filter(r => r.status === 'Leave').length;
  const absentDays = records.filter(r => r.status === 'Absent').length;
  const totalHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0);

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Today's Interactive Check In / Check Out Action */}
      <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-brand-600 via-brand-700 to-sky-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2 text-white">
            <Clock className="w-3.5 h-3.5" /> Daily Attendance Logger
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Employee Attendance</h1>
          <p className="text-brand-100 text-sm mt-1 font-medium">Check in daily and monitor work hours</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white min-w-[280px] shadow-lg">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Today's Status</span>
            {todayAtt ? <StatusBadge status={todayAtt.status} /> : <span className="text-xs text-white/90">Not logged today</span>}
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
                Check In
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
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed ({todayAtt.work_hours} hrs)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date / Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Attendance Log History</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Filter:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="!p-4 text-center">
          <div className="text-xs font-semibold text-slate-500">Present</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentDays}</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-xs font-semibold text-slate-500">Half-Day</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{halfDays}</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-xs font-semibold text-slate-500">On Leave</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{leaveDays}</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-xs font-semibold text-slate-500">Absent</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{absentDays}</div>
        </Card>
        <Card className="!p-4 text-center col-span-2 md:col-span-1">
          <div className="text-xs font-semibold text-slate-500">Total Hours</div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">{totalHours.toFixed(1)} hrs</div>
        </Card>
      </div>

      {/* Attendance History Table matching Excalidraw Columns */}
      <Card title={`Logs for ${month}`}>
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading attendance logs...</div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No attendance records found for {month}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4">Extra Hours</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {records.map((r) => {
                  const workHrs = r.work_hours || 0;
                  const extraHrs = Math.max(0, round(workHrs - 8.0));
                  return (
                    <tr key={r.id || r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-xs text-slate-500 uppercase">
                        {getDayName(r.date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {workHrs ? `${workHrs} hrs` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {extraHrs > 0 ? `+${extraHrs} hrs` : '0.0'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const round = (val) => Math.round(val * 10) / 10;
