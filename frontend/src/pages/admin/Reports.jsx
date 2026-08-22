import React, { useState } from 'react';
import { reportsApi } from '../../api/dashboardApi';
import { Card } from '../../components/common/Card';
import { Download, BarChart3, FileSpreadsheet, Calendar, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const Reports = () => {
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));

  // Dummy analytics data for visualization
  const attendanceChartData = [
    { day: 'Mon', Present: 4, Absent: 0, Leave: 1 },
    { day: 'Tue', Present: 5, Absent: 0, Leave: 0 },
    { day: 'Wed', Present: 4, Absent: 1, Leave: 0 },
    { day: 'Thu', Present: 3, Absent: 0, Leave: 2 },
    { day: 'Fri', Present: 5, Absent: 0, Leave: 0 },
  ];

  const leavePieData = [
    { name: 'Paid Leave', value: 12, color: '#0c8de4' },
    { name: 'Sick Leave', value: 5, color: '#f59e0b' },
    { name: 'Unpaid Leave', value: 3, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">HR Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Export audit statements and analyze org performance</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Export Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Attendance Report Export" subtitle="Download detailed check-in logs as CSV">
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Month: {targetMonth}</div>
              <div className="text-xs text-slate-500 mt-0.5">Includes check-in/out timestamps and work hours</div>
            </div>
            <a
              href={reportsApi.getAttendanceCsvUrl(targetMonth)}
              download
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download CSV
            </a>
          </div>
        </Card>

        <Card title="Payroll Report Export" subtitle="Download monthly salary slip audit as CSV">
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Month: {targetMonth}</div>
              <div className="text-xs text-slate-500 mt-0.5">Includes attendance summaries, deductions, net salary</div>
            </div>
            <a
              href={reportsApi.getPayrollCsvUrl(targetMonth)}
              download
              className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download CSV
            </a>
          </div>
        </Card>
      </div>

      {/* Recharts Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Attendance Distribution" subtitle="Daily breakdown of employee presence">
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Leave" fill="#0c8de4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Leave Type Utilization" subtitle="Proportion of time-off taken by category">
          <div className="h-64 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leavePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leavePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs font-semibold">
            {leavePieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
