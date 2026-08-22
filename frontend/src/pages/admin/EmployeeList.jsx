import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Edit, Power, Shield, UserCheck, Plus } from 'lucide-react';

export const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Selected Employee Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Form Fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [basic, setBasic] = useState(50000);
  const [hra, setHra] = useState(20000);
  const [allowances, setAllowances] = useState(10000);
  const [deductions, setDeductions] = useState(5000);
  const [isActive, setIsActive] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.listEmployees();
      setEmployees(res);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setFullName(emp.personal_details?.full_name || '');
    setDepartment(emp.job_details?.department || '');
    setDesignation(emp.job_details?.designation || '');
    setBasic(emp.salary_structure?.basic || 50000);
    setHra(emp.salary_structure?.hra || 20000);
    setAllowances(emp.salary_structure?.allowances || 10000);
    setDeductions(emp.salary_structure?.deductions || 5000);
    setIsActive(emp.is_active ?? True);
    setIsModalOpen(true);
  };

  const handleSaveAdminUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaving(true);

    try {
      await employeeApi.updateEmployeeAdmin(selectedEmp.employee_id, {
        personal_details: {
          ...selectedEmp.personal_details,
          full_name: fullName
        },
        job_details: {
          ...selectedEmp.job_details,
          department,
          designation
        },
        salary_structure: {
          basic: float(basic),
          hra: float(hra),
          allowances: float(allowances),
          deductions: float(deductions),
          currency: 'INR'
        },
        is_active: isActive
      });
      setIsModalOpen(false);
      await fetchEmployees();
    } catch (err) {
      alert(err || 'Failed to update employee profile.');
    } finally {
      setSaving(false);
    }
  };

  const float = (val) => parseFloat(val) || 0;

  // Filter employees
  const filtered = employees.filter((emp) => {
    const matchesSearch = 
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.personal_details?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || emp.job_details?.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Employee Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage employee profiles, job details, and salary structures</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Name, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employee List Table */}
      <Card title={`All Staff (${filtered.length})`}>
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No employees match your search query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filtered.map((emp) => {
                  const p = emp.personal_details || {};
                  const j = emp.job_details || {};
                  const s = emp.salary_structure || {};
                  const gross = (s.basic || 0) + (s.hra || 0) + (s.allowances || 0);

                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || emp.employee_id)}&background=0c8de4&color=fff`}
                            alt={p.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">{p.full_name || emp.employee_id}</div>
                            <div className="text-xs text-slate-400 font-mono">{emp.employee_id} • {emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{j.designation || '-'}</div>
                        <div className="text-xs text-slate-400">{j.department || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₹ {gross.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          emp.is_active 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {emp.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admin Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Edit Employee: ${selectedEmp?.employee_id}`}>
        <form onSubmit={handleSaveAdminUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Master Salary Structure */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Master Salary Structure (INR)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Basic Salary</label>
                <input
                  type="number"
                  value={basic}
                  onChange={(e) => setBasic(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">HRA</label>
                <input
                  type="number"
                  value={hra}
                  onChange={(e) => setHra(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Allowances</label>
                <input
                  type="number"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Deductions</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Active / Deactive Soft Delete Switcher (Rule #4) */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Account Status</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400">Rule #4: Soft-delete disables login & freezes payroll</div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isActive 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isActive ? 'Status: Active' : 'Status: Deactivated'}
            </button>
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
              className="py-2.5 px-6 rounded-xl bg-brand-500 text-white font-bold text-sm shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
