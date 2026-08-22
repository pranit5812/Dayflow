import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Calendar, Edit3, CheckCircle } from 'lucide-react';

export const AttendanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  // Manual Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmpId, setEditEmpId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState('Present');
  const [editReason, setEditReason] = useState('Admin manual correction');
  const [saving, setSaving] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.listAll({
        date: dateFilter || undefined,
        month: dateFilter ? undefined : monthFilter
      });
      setRecords(res);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Organization Attendance Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor employee check-ins and make manual adjustments</p>
        </div>

        <button
          onClick={() => handleOpenManualModal()}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Edit3 className="w-4 h-4" /> Manual Attendance Correction
        </button>
      </div>

      {/* Date & Month Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setDateFilter('');
                setMonthFilter(e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Specific Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="self-end pb-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Clear Specific Date
            </button>
          )}
        </div>
      </Card>

      {/* Attendance Matrix Table */}
      <Card title={`Attendance Logs (${records.length})`}>
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
