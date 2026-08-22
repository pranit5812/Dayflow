import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { leaveApi } from '../../api/leaveApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar as CalendarIcon, CheckCircle2, LogIn, LogOut, AlertCircle, LayoutGrid, Table, Hourglass } from 'lucide-react';

export const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [histRes, todayRes, leavesRes] = await Promise.all([
        attendanceApi.getMyHistory(month),
        attendanceApi.getToday(),
        leaveApi.getMyLeaves()
      ]);
      setRecords(histRes);
      setTodayAtt(todayRes);
      setPendingLeaves(leavesRes.filter(l => l.status === 'Pending'));
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

  // Calendar Grid Calculator
  const getCalendarDays = () => {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mIndex = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, mIndex, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, mIndex + 1, 0).getDate();

    const days = [];
    // Padding days before 1st
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isPadding: true, dayNum: '' });
    }

    // Actual days of month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${yearStr}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = records.find((r) => r.date === dateStr);
      const pendingLeave = pendingLeaves.find((l) => dateStr >= l.start_date && dateStr <= l.end_date);
      const dayOfWeek = new Date(year, mIndex, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push({
        isPadding: false,
        dayNum: d,
        dateStr,
        record: rec,
        pendingLeave,
        isWeekend,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const weekHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getMonthTitle = () => {
    const [y, m] = month.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

          <div className="text-[11px] font-mono font-bold text-white/90 mb-2 flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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

      {/* Aggregate Stats Cards with Color Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="!p-4 text-center border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-500">Present (🟢)</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentDays}</div>
        </Card>
        <Card className="!p-4 text-center border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-slate-500">Half-Day (🟡)</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{halfDays}</div>
        </Card>
        <Card className="!p-4 text-center border-l-4 border-l-sky-500">
          <div className="text-xs font-semibold text-slate-500">On Leave (🔵)</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{leaveDays}</div>
        </Card>
        <Card className="!p-4 text-center border-l-4 border-l-rose-500">
          <div className="text-xs font-semibold text-slate-500">Absent (🔴)</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{absentDays}</div>
        </Card>
        <Card className="!p-4 text-center col-span-2 md:col-span-1 border-l-4 border-l-brand-500">
          <div className="text-xs font-semibold text-slate-500">Total Hours</div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">{totalHours.toFixed(1)} hrs</div>
        </Card>
      </div>

      {/* Controls Bar: Month Selector & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{getMonthTitle()}</h3>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* View Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Calendar View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Log Table
            </button>
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Main View Mode Display */}
      {viewMode === 'calendar' ? (
        /* Compact Color-Coded Monthly Calendar Grid */
        <Card title={`Attendance Calendar — ${getMonthTitle()}`}>
          {/* Legend Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
              <span className="text-slate-700 dark:text-slate-300">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-sm"></span>
              <span className="text-slate-700 dark:text-slate-300">Approved Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
              <span className="text-slate-700 dark:text-slate-300">Leave Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm"></span>
              <span className="text-slate-700 dark:text-slate-300">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              <span className="text-slate-400">Weekend / Off</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading attendance calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {/* Day Headers */}
              {weekHeader.map((d, idx) => (
                <div key={idx} className="text-center py-1 text-xs font-black text-slate-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {/* Compact Day Cells */}
              {calendarDays.map((cell, i) => {
                if (cell.isPadding) {
                  return <div key={i} className="min-h-[62px] rounded-xl bg-slate-50/20 dark:bg-slate-900/10 border border-transparent"></div>;
                }

                const rec = cell.record;
                const pending = cell.pendingLeave;
                const status = rec?.status;
                const workHrs = rec?.work_hours || 0;

                let cardStyle = 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400';
                let badgeBg = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                let statusLabel = status;

                if (status === 'Present') {
                  cardStyle = 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-sm';
                  badgeBg = 'bg-emerald-500 text-white';
                } else if (status === 'Half-day') {
                  cardStyle = 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400/60 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-sm';
                  badgeBg = 'bg-amber-500 text-white';
                } else if (status === 'Leave') {
                  cardStyle = 'bg-sky-500/10 dark:bg-sky-950/40 border-sky-400/60 dark:border-sky-800 text-sky-950 dark:text-sky-200 shadow-sm';
                  badgeBg = 'bg-sky-500 text-white';
                  statusLabel = 'On Leave';
                } else if (pending) {
                  cardStyle = 'bg-amber-500/15 dark:bg-amber-950/50 border-amber-400/80 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-sm';
                  badgeBg = 'bg-amber-500 text-white font-black';
                  statusLabel = 'Pending';
                } else if (status === 'Absent') {
                  cardStyle = 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-400/60 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-sm';
                  badgeBg = 'bg-rose-500 text-white';
                } else if (cell.isWeekend) {
                  cardStyle = 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/40 dark:border-slate-800/40 text-slate-400';
                }

                return (
                  <div
                    key={i}
                    className={`min-h-[62px] p-1.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{cell.dayNum}</span>
                      {statusLabel ? (
                        <span className={`text-[8px] font-black px-1 py-0.2 rounded-md uppercase tracking-tight ${badgeBg}`}>
                          {statusLabel}
                        </span>
                      ) : cell.isWeekend ? (
                        <span className="text-[8px] font-bold text-slate-400 uppercase">OFF</span>
                      ) : null}
                    </div>

                    <div className="text-right">
                      {workHrs > 0 ? (
                        <div className="text-[10px] font-mono font-extrabold text-slate-800 dark:text-slate-100">
                          {workHrs}h
                        </div>
                      ) : pending ? (
                        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5">
                          <Hourglass className="w-2.5 h-2.5 animate-pulse" /> Leave Requested
                        </div>
                      ) : rec?.check_in ? (
                        <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Active
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        /* Attendance History Table View */
        <Card title={`Attendance Logs for ${getMonthTitle()}`}>
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
      )}
    </div>
  );
};

const round = (val) => Math.round(val * 10) / 10;
