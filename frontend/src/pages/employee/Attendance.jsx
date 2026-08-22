import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { leaveApi } from '../../api/leaveApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar as CalendarIcon, CheckCircle2, LogIn, LogOut, AlertCircle, LayoutGrid, Table, Hourglass, Sparkles, PartyPopper, BarChart2, TrendingUp, CalendarDays } from 'lucide-react';

const festiveHolidays = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-26', name: "Republic Day" },
  { date: '2026-03-25', name: "Holi Festival" },
  { date: '2026-08-15', name: "Independence Day" },
  { date: '2026-10-20', name: "Diwali Festival" },
  { date: '2026-10-21', name: "Deepavali Pujan" },
  { date: '2026-11-01', name: "Statehood Day" },
  { date: '2026-12-25', name: "Christmas Day" }
];

export const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'calendar' | 'table'

  const todayStr = new Date().toISOString().slice(0, 10);

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

  // Aggregate stats up to today only
  const presentDays = records.filter(r => r.status === 'Present').length;
  const halfDays = records.filter(r => r.status === 'Half-day').length;
  const leaveDays = records.filter(r => r.status === 'Leave').length;
  const absentDays = records.filter(r => r.status === 'Absent' && r.date <= todayStr).length;
  const festiveDays = festiveHolidays.filter(f => f.date.startsWith(month)).length;
  const totalHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0);

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Current Week Calculation (Monday to Sunday)
  const getCurrentWeekDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const rec = records.find(r => r.date === dStr);
      const pendingLeave = pendingLeaves.find(l => dStr >= l.start_date && dStr <= l.end_date);
      const festive = festiveHolidays.find(f => f.date === dStr);
      const isWeekend = i >= 5; // Sat, Sun
      const isFuture = dStr > todayStr;
      const isToday = dStr === todayStr;

      weekDays.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNum: d.getDate(),
        record: rec,
        pendingLeave,
        festive,
        isWeekend,
        isFuture,
        isToday
      });
    }
    return weekDays;
  };

  const weekDays = getCurrentWeekDays();
  const weeklyTotalHours = weekDays.reduce((sum, w) => sum + (w.record?.work_hours || 0), 0);
  const weeklyAvgHours = (weeklyTotalHours / 5).toFixed(1);

  // Calendar Grid Calculator
  const getCalendarDays = () => {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mIndex = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, mIndex, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, mIndex + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isPadding: true, dayNum: '' });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${yearStr}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = records.find((r) => r.date === dateStr);
      const pendingLeave = pendingLeaves.find((l) => dateStr >= l.start_date && dateStr <= l.end_date);
      const festive = festiveHolidays.find((f) => f.date === dateStr);
      const dayOfWeek = new Date(year, mIndex, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture = dateStr > todayStr;

      days.push({
        isPadding: false,
        dayNum: d,
        dateStr,
        record: rec,
        pendingLeave,
        festive,
        isWeekend,
        isFuture
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
    <div className="space-y-6 font-sans">
      {/* Top Banner with Today's Interactive Check In / Check Out Action */}
      <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-brand-600 via-brand-700 to-sky-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-extrabold mb-2 text-white">
            <Clock className="w-3.5 h-3.5" /> Daily & Weekly Attendance Tracker
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Employee Attendance Hub</h1>
          <p className="text-brand-100 text-sm mt-1 font-medium">Log daily shifts, monitor weekly work hours, and view attendance trends</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white min-w-[280px] shadow-lg">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Today's Daily Status</span>
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

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="!p-3.5 text-center border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-semibold text-slate-500">Present (🟢)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{presentDays}</div>
        </Card>
        <Card className="!p-3.5 text-center border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold text-slate-500">Half-Day (🟡)</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{halfDays}</div>
        </Card>
        <Card className="!p-3.5 text-center border-l-4 border-l-sky-500">
          <div className="text-[11px] font-semibold text-slate-500">On Leave (🔵)</div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{leaveDays}</div>
        </Card>
        <Card className="!p-3.5 text-center border-l-4 border-l-purple-500">
          <div className="text-[11px] font-semibold text-slate-500">Festive (🟣)</div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{festiveDays}</div>
        </Card>
        <Card className="!p-3.5 text-center border-l-4 border-l-rose-500">
          <div className="text-[11px] font-semibold text-slate-500">Absent (🔴)</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{absentDays}</div>
        </Card>
        <Card className="!p-3.5 text-center col-span-2 md:col-span-1 border-l-4 border-l-brand-500">
          <div className="text-[11px] font-semibold text-slate-500">Total Hours</div>
          <div className="text-xl font-black text-brand-600 dark:text-brand-400 mt-0.5">{totalHours.toFixed(1)} hrs</div>
        </Card>
      </div>

      {/* Controls Bar: View Mode Switcher (Weekly vs Calendar vs Table) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              viewMode === 'weekly'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Weekly View (Mon–Sun)
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Monthly Calendar
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Log Table
          </button>
        </div>

        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-brand-500" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'weekly' ? (
        /* Dedicated Weekly Attendance View (Mon-Sun) */
        <div className="space-y-4">
          <Card title="Current Week Attendance Breakdown (Monday to Sunday)" subtitle={`Logged: ${weeklyTotalHours.toFixed(1)} hrs total • Avg ${weeklyAvgHours} hrs/day`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
              {weekDays.map((item, idx) => {
                const rec = item.record;
                const workHrs = rec?.work_hours || 0;
                const progressPct = Math.min(100, Math.round((workHrs / 8.0) * 100));

                let statusBadge = <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Not Logged</span>;
                let borderStyle = 'border-slate-200 dark:border-slate-800';

                if (item.festive) {
                  statusBadge = <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500 text-white">Festive 🟣</span>;
                  borderStyle = 'border-purple-500/50 bg-purple-500/5';
                } else if (rec?.status === 'Present') {
                  statusBadge = <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500 text-white">Present 🟢</span>;
                  borderStyle = 'border-emerald-500/50 bg-emerald-500/5';
                } else if (rec?.status === 'Half-day') {
                  statusBadge = <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white">Half-Day 🟡</span>;
                  borderStyle = 'border-amber-500/50 bg-amber-500/5';
                } else if (rec?.status === 'Leave') {
                  statusBadge = <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-500 text-white">Leave 🔵</span>;
                  borderStyle = 'border-sky-500/50 bg-sky-500/5';
                } else if (rec?.status === 'Absent' && !item.isFuture) {
                  statusBadge = <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500 text-white">Absent 🔴</span>;
                  borderStyle = 'border-rose-500/50 bg-rose-500/5';
                } else if (item.isWeekend) {
                  statusBadge = <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">Weekend ⚪</span>;
                }

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${borderStyle} ${
                      item.isToday ? 'ring-2 ring-brand-500 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-200">{item.dayName}</div>
                        <div className="text-[10px] font-bold text-slate-400">{item.dateStr.slice(5)}</div>
                      </div>
                      {item.isToday && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-brand-500 text-white uppercase">Today</span>
                      )}
                    </div>

                    <div>{statusBadge}</div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Shift</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{workHrs > 0 ? `${workHrs} hrs` : '--'}</span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            workHrs >= 7.0 ? 'bg-emerald-500' : workHrs > 0 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : viewMode === 'calendar' ? (
        /* Monthly Calendar Grid */
        <Card title={`Attendance Calendar — ${getMonthTitle()}`}>
          <div className="flex flex-wrap items-center gap-3 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
              <span className="text-slate-700 dark:text-slate-300">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-sm"></span>
              <span className="text-purple-700 dark:text-purple-300">Festive Holiday (🟣)</span>
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
              <span className="text-slate-700 dark:text-slate-300">Absent (Past Days)</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading attendance calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {weekHeader.map((d, idx) => (
                <div key={idx} className="text-center py-1 text-xs font-black text-slate-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {calendarDays.map((cell, i) => {
                if (cell.isPadding) {
                  return <div key={i} className="min-h-[58px] rounded-xl bg-slate-50/20 dark:bg-slate-900/10 border border-transparent"></div>;
                }

                const rec = cell.record;
                const pending = cell.pendingLeave;
                const festive = cell.festive;
                const status = rec?.status;
                const workHrs = rec?.work_hours || 0;
                const isToday = cell.dateStr === todayStr;

                let cardStyle = 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400';
                let badgeBg = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                let statusLabel = null;

                if (festive) {
                  cardStyle = 'bg-purple-500/15 dark:bg-purple-950/50 border-purple-400/80 dark:border-purple-800 text-purple-950 dark:text-purple-200 shadow-sm';
                  badgeBg = 'bg-purple-600 text-white font-extrabold';
                  statusLabel = 'Festive';
                } else if (pending) {
                  cardStyle = 'bg-amber-500/15 dark:bg-amber-950/50 border-amber-400/80 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-sm';
                  badgeBg = 'bg-amber-500 text-white font-black';
                  statusLabel = 'Pending';
                } else if (cell.isFuture) {
                  cardStyle = 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/40 dark:border-slate-800/40 text-slate-400';
                  statusLabel = null;
                } else if (status === 'Present') {
                  cardStyle = 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-sm';
                  badgeBg = 'bg-emerald-500 text-white';
                  statusLabel = 'Present';
                } else if (status === 'Half-day') {
                  cardStyle = 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400/60 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-sm';
                  badgeBg = 'bg-amber-500 text-white';
                  statusLabel = 'Half-day';
                } else if (status === 'Leave') {
                  cardStyle = 'bg-sky-500/10 dark:bg-sky-950/40 border-sky-400/60 dark:border-sky-800 text-sky-950 dark:text-sky-200 shadow-sm';
                  badgeBg = 'bg-sky-500 text-white';
                  statusLabel = 'On Leave';
                } else if (status === 'Absent') {
                  cardStyle = 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-400/60 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-sm';
                  badgeBg = 'bg-rose-500 text-white';
                  statusLabel = 'Absent';
                } else if (cell.isWeekend) {
                  cardStyle = 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/40 dark:border-slate-800/40 text-slate-400';
                  statusLabel = null;
                }

                return (
                  <div
                    key={i}
                    className={`min-h-[58px] p-1.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${cardStyle} ${
                      isToday ? 'ring-2 ring-brand-500 shadow-md font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${isToday ? 'text-brand-600 dark:text-brand-400' : ''}`}>{cell.dayNum}</span>
                      {statusLabel ? (
                        <span className={`text-[8px] font-black px-1 py-0.2 rounded-md uppercase tracking-tight ${badgeBg}`}>
                          {statusLabel}
                        </span>
                      ) : cell.isWeekend ? (
                        <span className="text-[8px] font-bold text-slate-400 uppercase">OFF</span>
                      ) : isToday ? (
                        <span className="text-[8px] font-bold text-brand-500 uppercase">TODAY</span>
                      ) : null}
                    </div>

                    <div className="text-right">
                      {festive ? (
                        <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 truncate">
                          🎉 {festive.name}
                        </div>
                      ) : workHrs > 0 ? (
                        <div className="text-[10px] font-mono font-extrabold text-slate-800 dark:text-slate-100">
                          {workHrs}h
                        </div>
                      ) : pending ? (
                        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5">
                          <Hourglass className="w-2.5 h-2.5 animate-pulse" /> Pending
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
