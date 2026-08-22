import React, { useState, useEffect } from 'react';
import { payrollApi } from '../../api/payrollApi';
import { reportsApi } from '../../api/dashboardApi';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DollarSign, Play, CheckCircle, Download, AlertCircle, Info, Lock } from 'lucide-react';

export const PayrollControl = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [workingDays, setWorkingDays] = useState(22);
  const [genLoading, setGenLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPayrollSlips = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.listAll({ month });
      setSlips(res);
    } catch (err) {
      console.error('Error fetching payroll slips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollSlips();
  }, [month]);

  const handleRunBulkPayroll = async () => {
    setGenLoading(true);
    setMsg('');
    try {
      const res = await payrollApi.generatePayroll({
        month,
        total_working_days: parseInt(workingDays) || 22
      });
      setMsg(`Payroll run complete for month ${month}! Generated ${Array.isArray(res) ? res.length : 1} slip(s).`);
      await fetchPayrollSlips();
    } catch (err) {
      setMsg(err || 'Failed to generate payroll.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleFinalize = async (slipId) => {
    if (!window.confirm('Finalizing will lock this salary slip permanently and notify the employee. Proceed?')) return;
    try {
      await payrollApi.finalizeSlip(slipId);
      await fetchPayrollSlips();
    } catch (err) {
      alert(err || 'Failed to finalize slip.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Payroll Engine & Salary Slips</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate monthly payroll based on attendance and unpaid leave deductions</p>
        </div>
      </div>

      {/* Payroll Run Generator Controls */}
      <Card className="!p-6 bg-gradient-to-r from-slate-900 to-brand-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">Payroll Generation Engine</div>
            <h3 className="text-xl font-bold">Run Monthly Payroll Calculation</h3>
            <p className="text-xs text-slate-300">
              Rule #2: Reads attendance records for target month and calculates per-day unpaid leave deductions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Target Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Working Days</label>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
              />
            </div>

            <button
              onClick={handleRunBulkPayroll}
              disabled={genLoading}
              className="self-end py-2 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {genLoading ? 'Computing...' : 'Run Payroll'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {msg}
          </div>
        )}
      </Card>

      {/* Generated Payroll Slips Table */}
      <Card title={`Generated Slips for ${month} (${slips.length})`}>
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading payroll slips...</div>
        ) : slips.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No payroll slips generated for {month}. Use the controls above to run payroll.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Attendance Breakdown</th>
                  <th className="py-3 px-4">Gross Salary</th>
                  <th className="py-3 px-4">Unpaid Deduction</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {slips.map((slip) => {
                  const att = slip.attendance_summary || {};
                  const sb = slip.salary_breakdown || {};
                  const isFinal = slip.status === 'finalized';

                  return (
                    <tr key={slip.id || slip._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                        <div>{slip.employee_name || slip.employee_id}</div>
                        <div className="text-xs text-slate-400 font-mono font-normal">{slip.employee_id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div>Present: <strong>{att.present ?? 0}</strong> | Half: {att.half_day ?? 0}</div>
                        {att.unpaid_leave > 0 && (
                          <div className="text-rose-500 font-bold">Unpaid Leave: {att.unpaid_leave} days</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        ₹ {slip.gross_salary?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600 dark:text-rose-400">
                        - ₹ {(sb.unpaid_leave_deduction || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ₹ {slip.net_salary?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={slip.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <a
                          href={reportsApi.getPaystubPdfUrl(slip.id || slip._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>

                        {!isFinal && (
                          <button
                            onClick={() => handleFinalize(slip.id || slip._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <Lock className="w-3.5 h-3.5" /> Finalize
                          </button>
                        )}
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
