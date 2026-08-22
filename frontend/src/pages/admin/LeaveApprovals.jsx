import React, { useState, useEffect } from 'react';
import { leaveApi } from '../../api/leaveApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Request Review Modal
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminComments, setAdminComments] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await leaveApi.listAll({ status_filter: statusFilter || undefined });
      setLeaves(res);
    } catch (err) {
      console.error('Error fetching leave approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleOpenReview = (leaveItem) => {
    setSelectedLeave(leaveItem);
    setAdminComments(leaveItem.admin_comments || '');
    setIsModalOpen(true);
  };

  const handleProcessReview = async (actionStatus) => {
    if (!selectedLeave) return;
    setReviewing(true);

    try {
      await leaveApi.review(selectedLeave.id || selectedLeave._id, {
        status: actionStatus,
        admin_comments: adminComments
      });
      setIsModalOpen(false);
      await fetchLeaves();
    } catch (err) {
      alert(err || 'Failed to review leave request.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Leave Approvals & Auto-Sync</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review employee leave requests. Approvals trigger attendance auto-sync.</p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Only</option>
          <option value="Approved">Approved Only</option>
          <option value="Rejected">Rejected Only</option>
        </select>
      </div>

      {/* Auto-Sync Rule Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-brand-50 dark:from-slate-900 dark:to-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-brand-900 dark:text-brand-200">Rule #1: Leave → Attendance Auto-Sync Active</div>
          <div className="text-xs text-brand-700 dark:text-brand-300 mt-0.5">
            When you approve a leave request, Dayflow automatically generates or updates attendance entries for every date in the leave range with <span className="font-mono bg-brand-100 dark:bg-brand-900/80 px-1 rounded">status = "Leave"</span> and <span className="font-mono bg-brand-100 dark:bg-brand-900/80 px-1 rounded">source = "auto-leave-sync"</span>.
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <Card title={`Leave Requests (${leaves.length})`}>
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading leave requests...</div>
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No leave requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {leaves.map((l) => (
                  <tr key={l.id || l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                      <div>{l.employee_name || l.employee_id}</div>
                      <div className="text-xs text-slate-400 font-mono font-normal">{l.employee_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold uppercase text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {l.leave_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {l.start_date} to {l.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {l.days_count} day(s)
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {l.remarks || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <button
                          onClick={() => handleOpenReview(l)}
                          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          Review Request
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(l)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium hover:underline"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Review Leave Application">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLeave?.employee_name} ({selectedLeave?.employee_id})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Leave Category:</span>
              <span className="font-bold uppercase text-brand-600 dark:text-brand-400">{selectedLeave?.leave_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Dates:</span>
              <span className="font-medium">{selectedLeave?.start_date} to {selectedLeave?.end_date} ({selectedLeave?.days_count} days)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remarks:</span>
              <span className="italic text-slate-700 dark:text-slate-300">{selectedLeave?.remarks || 'None'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Admin Comments / Reason
            </label>
            <textarea
              rows={3}
              placeholder="Add optional notes for the employee..."
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
            <strong>Auto-Sync Note:</strong> Approving this request will automatically populate the employee's attendance calendar for {selectedLeave?.start_date} to {selectedLeave?.end_date}.
          </div>

          <div className="pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm"
            >
              Close
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleProcessReview('Rejected')}
                className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleProcessReview('Approved')}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Auto-Sync
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
