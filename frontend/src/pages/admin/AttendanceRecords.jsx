import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { employeeApi } from '../../api/employeeApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar, Edit3, CheckCircle, CalendarDays, Users, TrendingUp, BarChart2, Shield } from 'lucide-react';

export const AttendanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'daily'

  // Manual Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmpId, setEditEmpId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState('Present');
  const [editReason, setEditReason] = useState('Admin manual correction');
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceApi.listAll({
          date: dateFilter || undefined,
          month: dateFilter ? undefined : monthFilter
        }),
        employeeApi.listEmployees()
      ]);
      setRecords(attRes);
      setEmployees(empRes);
    } catch (err) {
      console.error('Error fetching org attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, monthFilter]);

  const handleOpenManualModal = (rec = null) => {
    if (rec) {
      setEditEmpId(rec.employee_id);
      setEditDate(rec.date);
      setEditStatus(rec.status);
    } else {
      setEditEmpId('');
      setEditDate(new Date().toISOString().slice(0, 10));
      setEditStatus('Present');
    }
    setIsModalOpen(true);
  };

  const handleSaveManualCorrection = async (e) => {
    e.preventDefault();
    if (!editEmpId || !editDate) return;
    setSaving(true);

    try {
      await attendanceApi.manualUpdate({
        employee_id: editEmpId,
        date: editDate,
        status: editStatus,
        reason: editReason
      });
      setIsModalOpen(false);
      await fetchAttendance();
    } catch (err) {
      alert(err || 'Failed to correct attendance record.');
    } finally {
      setSaving(false);
    }
  };

  // Weekly Organization Breakdown Calculator (Mon to Sun)
  const getOrgWeeklyDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays = [];
    const totalStaff = employees.length || 1;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);

      const dayRecords = records.filter(r => r.date === dStr);
      const presentCount = dayRecords.filter(r => r.status === 'Present').length;
      const halfDayCount = dayRecords.filter(r => r.status === 'Half-day').length;
      const leaveCount = dayRecords.filter(r => r.status === 'Leave').length;
      const totalHoursLogged = dayRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0);

      const attendanceRatePct = Math.min(100, Math.round(((presentCount + halfDayCount * 0.5) / totalStaff) * 100));

      weekDays.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        presentCount,
        halfDayCount,
        leaveCount,
        totalHoursLogged,
        attendanceRatePct,
        isWeekend: i >= 5,
        isToday: dStr === todayStr
      });
    }
    return weekDays;
  };

  const orgWeekDays = getOrgWeeklyDays();
  const totalStaffCount = employees.length;
  const todayRecords = records.filter(r => r.date === todayStr);
  const todayCheckedInCount = todayRecords.filter(r => r.check_in).length;
  const todayPresentCount = todayRecords.filter(r => r.status === 'Present').length;
  const todayHalfDayCount = todayRecords.filter(r => r.status === 'Half-day').length;
  const todayLeaveCount = todayRecords.filter(r => r.status === 'Leave').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4 text-purple-400" /> HR Command Center
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">Organization Attendance Hub</h1>
          <p className="text-slate-300 text-sm mt-1">Monitor daily team check-ins, analyze weekly workforce attendance trends, and apply overrides</p>
        </div>

        <button
          onClick={() => handleOpenManualModal()}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Edit3 className="w-4 h-4" /> Manual Attendance Override
        </button>
      </div>

      {/* Aggregate Daily Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="!p-4 border-t-4 border-t-purple-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Active Staff</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalStaffCount}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-brand-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Today's Check-Ins</div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">{todayCheckedInCount}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-emerald-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Full Day Present</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{todayPresentCount}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-amber-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Half-Day Alerts</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{todayHalfDayCount}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-sky-500 text-center col-span-2 md:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Staff On Leave</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{todayLeaveCount}</div>
        </Card>
      </div>

      {/* Navigation Switcher: Weekly vs Daily Logs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Weekly Team Overview (Mon–Sun)
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Daily Attendance Logs ({records.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setDateFilter('');
              setMonthFilter(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Main Tab View */}
      {activeTab === 'weekly' ? (
        /* Dedicated Weekly Organization Breakdown (Mon to Sun) */
        <Card title="Weekly Organization Attendance Breakdown (Monday to Sunday)" subtitle="Company-wide daily attendance rate, staff present, and total shift hours logged">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
            {orgWeekDays.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                  item.isToday
                    ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">{item.dayName}</div>
                    <div className="text-[10px] font-bold text-slate-400">{item.dateStr.slice(5)}</div>
                  </div>
                  {item.isToday && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-600 text-white uppercase">Today</span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Present:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{item.presentCount} staff</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Half-Day:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">{item.halfDayCount} staff</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">On Leave:</span>
                    <span className="font-extrabold text-sky-600 dark:text-sky-400">{item.leaveCount} staff</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Logged:</span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">{item.totalHoursLogged.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Company Attendance % Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Team Rate</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">{item.attendanceRatePct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                      style={{ width: `${item.attendanceRatePct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Daily Attendance Logs Table View */
        <Card title={`Attendance Log Matrix (${records.length} Records)`}>
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading attendance logs...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No attendance records found for selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Work Hours</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {records.map((r) => (
                    <tr key={r.id || r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.employee_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                        {r.work_hours ? `${r.work_hours} hrs` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                          {r.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenManualModal(r)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Manual Update Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manual Attendance Adjustment">
        <form onSubmit={handleSaveManualCorrection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
            <input
              type="text"
              required
              placeholder="e.g. EMP1001"
              value={editEmpId}
              onChange={(e) => setEditEmpId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attendance Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="Present">Present</option>
                <option value="Half-day">Half-day</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason for Manual Override</label>
            <input
              type="text"
              required
              placeholder="e.g. Forgot check-in / Doctor appointment correction"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Apply Correction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
