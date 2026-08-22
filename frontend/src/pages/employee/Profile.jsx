import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { 
  User, Phone, MapPin, Briefcase, DollarSign, FileText, Upload, Save, 
  CheckCircle, Shield, Award, Landmark, CreditCard, Mail, Calendar, FileBadge, Lock
} from 'lucide-react';

export const Profile = () => {
  const { role, userProfile, setUserProfile } = useAuth();
  const [profile, setProfile] = useState(userProfile);
  const [loading, setLoading] = useState(!userProfile);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Tab State: 'personal' | 'private' | 'resume' | 'skills' | 'salary'
  const [activeTab, setActiveTab] = useState('personal');

  // Editable Personal Fields State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [nationality, setNationality] = useState('Indian');
  const [maritalStatus, setMaritalStatus] = useState('Single');

  // Editable Document State
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await employeeApi.getMyProfile();
        setProfile(res);
        setPhone(res?.personal_details?.phone || '');
        setAddress(res?.personal_details?.address || '');
        setProfilePic(res?.personal_details?.profile_picture_url || '');
        setPersonalEmail(res?.personal_details?.personal_email || '');
        setGender(res?.personal_details?.gender || 'Male');
        setNationality(res?.personal_details?.nationality || 'Indian');
        setMaritalStatus(res?.personal_details?.marital_status || 'Single');
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSelfUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const updated = await employeeApi.updateMyProfile({
        phone,
        address,
        profile_picture_url: profilePic,
        personal_email: personalEmail,
        gender,
        nationality,
        marital_status: maritalStatus
      });
      setProfile(updated);
      setUserProfile(updated);
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docName || !docUrl) return;
    setDocLoading(true);

    try {
      const updated = await employeeApi.uploadDocument(profile.employee_id, docName, docUrl);
      setProfile(updated);
      setUserProfile(updated);
      setDocName('');
      setDocUrl('');
    } catch (err) {
      alert(err || 'Failed to upload document.');
    } finally {
      setDocLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile details...</div>;
  }

  const personal = profile?.personal_details || {};
  const job = profile?.job_details || {};
  const privateInfo = profile?.private_details || {};
  const skillsInfo = profile?.skills_certifications || {};
  const salary = profile?.salary_structure || {};
  const docs = profile?.documents || [];

  const monthlyWage = (salary.basic || 0) + (salary.hra || 0) + (salary.allowances || 0);
  const yearlyWage = monthlyWage * 12;

  const tabStyle = (tabKey) =>
    `px-4 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
      activeTab === tabKey
        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="space-y-6">
      {/* Header Profile Banner matching Excalidraw */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        <img
          src={personal.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(personal.full_name || 'User')}&background=0c8de4&color=fff`}
          alt={personal.full_name}
          className="w-28 h-28 rounded-2xl object-cover border-4 border-brand-500/30 shadow-xl"
        />
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{personal.full_name || profile?.employee_id}</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {job.company || 'Dayflow HRMS'}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{job.designation} • {job.department}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Code</span>
              <strong className="text-slate-800 dark:text-slate-200">{profile?.employee_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Email</span>
              <strong className="text-slate-800 dark:text-slate-200 truncate block">{profile?.email}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Manager</span>
              <strong className="text-slate-800 dark:text-slate-200">{job.manager_id || 'HR Director'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
              <strong className="text-slate-800 dark:text-slate-200">{job.location || 'San Francisco, CA'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Excalidraw Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800">
        <button onClick={() => setActiveTab('personal')} className={tabStyle('personal')}>
          <User className="w-3.5 h-3.5" /> Personal / Job Info
        </button>
        <button onClick={() => setActiveTab('private')} className={tabStyle('private')}>
          <Lock className="w-3.5 h-3.5" /> Private Info
        </button>
        <button onClick={() => setActiveTab('resume')} className={tabStyle('resume')}>
          <FileText className="w-3.5 h-3.5" /> Resume & Docs
        </button>
        <button onClick={() => setActiveTab('skills')} className={tabStyle('skills')}>
          <Award className="w-3.5 h-3.5" /> Skills & Certifications
        </button>
        <button onClick={() => setActiveTab('salary')} className={tabStyle('salary')}>
          <DollarSign className="w-3.5 h-3.5" /> Salary Info
        </button>
      </div>

      {/* Tab 1: Personal & Job Information */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Personal Information (Self-Service)" subtitle="Update your contact phone, address, and personal details">
              {msg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {msg}
                </div>
              )}

              <form onSubmit={handleSelfUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555-0199"
                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Personal Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="personal@gmail.com"
                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nationality</label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Marital Status</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Residing Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </Card>
          </div>

          <Card title="Employment Information" subtitle="Official job details from backend">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Company</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.company || 'Dayflow HRMS'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Position</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.designation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Date of Joining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.date_of_joining}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Reporting Manager</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.manager_id || 'HR Director'}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Private / Bank Security Info */}
      {activeTab === 'private' && (
        <Card title="Private Security & Bank Information" subtitle="Bank account details, PAN, and UAN number">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <Landmark className="w-6 h-6 text-brand-500 mb-2" />
              <div className="text-xs font-bold text-slate-400 uppercase">Bank Name</div>
              <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">{privateInfo.bank_name || 'HDFC Bank'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <CreditCard className="w-6 h-6 text-emerald-500 mb-2" />
              <div className="text-xs font-bold text-slate-400 uppercase">Account Number</div>
              <div className="text-lg font-mono font-black text-slate-800 dark:text-slate-100 mt-1">{privateInfo.account_number || '••••••••4892'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <FileBadge className="w-6 h-6 text-purple-500 mb-2" />
              <div className="text-xs font-bold text-slate-400 uppercase">IFSC Code</div>
              <div className="text-lg font-mono font-black text-slate-800 dark:text-slate-100 mt-1">{privateInfo.ifsc_code || 'HDFC0001234'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <Shield className="w-6 h-6 text-sky-500 mb-2" />
              <div className="text-xs font-bold text-slate-400 uppercase">PAN Number</div>
              <div className="text-lg font-mono font-black text-slate-800 dark:text-slate-100 mt-1">{privateInfo.pan || 'ABCDE1234F'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-xs font-bold text-slate-400 uppercase">UAN Number</div>
              <div className="text-lg font-mono font-black text-slate-800 dark:text-slate-100 mt-1">{privateInfo.uan || '100987654321'}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Resume & Documents */}
      {activeTab === 'resume' && (
        <Card title="Resume & Attached Documents" subtitle="Upload and manage employment files">
          <form onSubmit={handleDocUpload} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <input
              type="text"
              required
              placeholder="Document Name (e.g. Resume_2026.pdf)"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
            <input
              type="url"
              required
              placeholder="Document URL (https://...)"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={docLoading}
              className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              {docLoading ? 'Uploading...' : 'Attach Document'}
            </button>
          </form>

          {docs.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No documents attached yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-brand-500" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">Uploaded {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Skills & Certifications */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Technical & Professional Skills" subtitle="Core competencies verified in Dayflow">
            <div className="flex flex-wrap gap-2.5 mt-2">
              {(skillsInfo.skills || ["React", "FastAPI", "Python", "MongoDB", "TailwindCSS", "HR Analytics"]).map((sk, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold">
                  {sk}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Professional Certifications" subtitle="Accreditation & licenses">
            <div className="space-y-3 mt-2">
              {(skillsInfo.certifications || ["AWS Certified Developer", "Certified HR Specialist"]).map((cert, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cert}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Salary Information matching Excalidraw */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="!p-6 bg-gradient-to-tr from-brand-600 to-sky-600 text-white">
              <div className="text-xs font-bold uppercase text-brand-100 tracking-wider">Monthly Base Wage</div>
              <div className="text-3xl font-black mt-2">₹ {monthlyWage.toLocaleString()}</div>
              <div className="text-xs text-brand-100 mt-1">Calculated base gross earnings per month</div>
            </Card>

            <Card className="!p-6 bg-gradient-to-tr from-purple-700 to-slate-900 text-white">
              <div className="text-xs font-bold uppercase text-purple-200 tracking-wider">Annual Base CTC</div>
              <div className="text-3xl font-black mt-2">₹ {yearlyWage.toLocaleString()}</div>
              <div className="text-xs text-purple-200 mt-1">Annualized base gross compensation package</div>
            </Card>
          </div>

          <Card title="Detailed Salary Component Structure" subtitle={role === 'admin' ? "Editable by Admin" : "Read-only for employee"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Earnings & Allowances</h4>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {(salary.basic || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {(salary.hra || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Standard & Fixed Allowance</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {(salary.allowances || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Deductions & Contributions</h4>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-500">
                  <span className="text-sm">Standard Deductions</span>
                  <span className="font-mono font-bold">- ₹ {(salary.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <span className="text-sm">Provident Fund (PF)</span>
                  <span className="font-mono text-xs">Included in standard deductions</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <span className="text-sm">Unpaid Leave Deduction</span>
                  <span className="font-mono text-xs">Calculated dynamically at payroll run</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
