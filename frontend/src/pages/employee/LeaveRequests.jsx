import React, { useState, useEffect } from 'react';
import { leaveApi } from '../../api/leaveApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Calendar, AlertCircle, Upload, Paperclip, Clock, CheckCircle2, Info, MessageSquare } from 'lucide-react';

export const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const [leavesRes, balRes] = await Promise.all([
        leaveApi.getMyLeaves(),
        leaveApi.getMyBalance()
      ]);
      setLeaves(leavesRes);
      setBalance(balRes);
    } catch (err) {
      console.error('Error fetching leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate requested duration in days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays();

  // Get available count for selected type
  const getAvailableCount = () => {
    if (leaveType === 'paid') return balance?.paid_remaining ?? 15;
    if (leaveType === 'sick') return balance?.sick_remaining ?? 10;
    return Infinity; // Unpaid leave is unlimited
  };

  const availableCount = getAvailableCount();
  const isOverBalance = leaveType !== 'unpaid' && requestedDays > availableCount;

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await leaveApi.apply({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        remarks: attachmentUrl ? `${remarks} (Attachment: ${attachmentUrl})` : remarks
      });
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setRemarks('');
      setAttachmentUrl('');
      await fetchData();
    } catch (err) {
      setFormError(err || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Time Off Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Apply for time-off and track available allocations</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Apply for Time Off
        </button>
      </div>

      {/* Leave Allocation Cards matching Excalidraw */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Paid Time Off (PTO)" subtitle="Annual allotted allowance">
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{balance?.paid_remaining ?? 15}</span>
            <span className="text-xs font-semibold text-slate-500">Available out of {balance?.paid_allotted ?? 15} Days</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, ((balance?.paid_remaining ?? 15) / (balance?.paid_allotted ?? 15)) * 100)}%` }}
            />
          </div>
        </Card>

        <Card title="Sick Time Off" subtitle="Medical leave allowance">
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{balance?.sick_remaining ?? 10}</span>
            <span className="text-xs font-semibold text-slate-500">Available out of {balance?.sick_allotted ?? 10} Days</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, ((balance?.sick_remaining ?? 10) / (balance?.sick_allotted ?? 10)) * 100)}%` }}
            />
          </div>
        </Card>

        <Card title="Unpaid Leave" subtitle="Reduces gross salary per-day rate">
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{balance?.unpaid_used ?? 0}</span>
            <span className="text-xs font-semibold text-slate-500">Days Taken</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Affects monthly payroll calculation</p>
        </Card>
      </div>

      {/* Leave Requests Table matching Excalidraw columns */}
      <Card title="My Time Off Requests">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading requests...</div>
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No time-off requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Time Off Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {leaves.map((l) => (
                  <tr key={l.id || l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {l.employee_name || l.employee_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {l.start_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {l.end_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold uppercase text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {l.leave_type === 'paid' ? 'Paid Time Off' : l.leave_type === 'sick' ? 'Sick Leave' : 'Unpaid Leave'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {l.admin_comments ? (
                        <div className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                          l.status === 'Approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : l.status === 'Rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>{l.admin_comments}</span>
                        </div>
                      ) : l.status !== 'Pending' ? (
                        <span className="text-slate-400 italic text-[11px]">No remarks added</span>
                      ) : (
                        <span className="text-amber-500/80 text-[11px] font-medium">Awaiting HR review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal with Balance Count & Duration Calculator */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Time Off">
        {/* Live Balance Summary Cards inside Modal */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Paid Leave</div>
            <div className="text-base font-black text-brand-600 dark:text-brand-400 mt-0.5">{balance?.paid_remaining ?? 15} Days</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sick Leave</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{balance?.sick_remaining ?? 10} Days</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Used</div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">{balance?.unpaid_used ?? 0} Days</div>
          </div>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {formError}
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Time Off Type & Available Balance
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-semibold"
            >
              <option value="paid">Paid Time Off (PTO) — {balance?.paid_remaining ?? 15} Days Available</option>
              <option value="sick">Sick Leave — {balance?.sick_remaining ?? 10} Days Available</option>
              <option value="unpaid">Unpaid Leave — Unlimited (Salary Deducted)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Requested Duration & Overbalance Badge */}
          {requestedDays > 0 && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              isOverBalance
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Requested Duration: <strong>{requestedDays} Day{requestedDays > 1 ? 's' : ''}</strong></span>
              </div>
              <span className="text-[11px] font-mono uppercase bg-white/60 dark:bg-slate-800/80 px-2 py-0.5 rounded font-bold">
                {isOverBalance ? `Exceeds ${availableCount}d Limit` : 'Within Balance'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Remarks / Purpose
            </label>
            <textarea
              rows={3}
              required
              placeholder="Reason for time off request..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Sick Leave Attachment UI */}
          {leaveType === 'sick' && (
            <div>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Medical Note Attachment URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Time Off Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
