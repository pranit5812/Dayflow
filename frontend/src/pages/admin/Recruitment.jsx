import React, { useState, useEffect } from 'react';
import { recruitmentApi } from '../../api/recruitmentApi';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Briefcase, Users, UserPlus, Plus, CheckCircle2, XCircle, ChevronRight, Mail, Phone, Calendar, ArrowRight, Filter, Search, Sparkles, Building2, MapPin } from 'lucide-react';

const pipelineStages = [
  { key: 'Applied', title: 'Applied', color: 'bg-slate-500' },
  { key: 'Screening', title: 'Screening', color: 'bg-sky-500' },
  { key: 'Interview', title: 'Interview', color: 'bg-purple-500' },
  { key: 'Offer', title: 'Offer Extended', color: 'bg-amber-500' },
  { key: 'Hired', title: 'Hired', color: 'bg-emerald-500' },
  { key: 'Rejected', title: 'Rejected', color: 'bg-rose-500' }
];

export const Recruitment = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'jobs'

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  // Job Form
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [jobType, setJobType] = useState('Full-Time');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSubmitting, setJobSubmitting] = useState(false);

  // Candidate Form
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candJobTitle, setCandJobTitle] = useState('');
  const [candStage, setCandStage] = useState('Applied');
  const [candNotes, setCandNotes] = useState('');
  const [candSubmitting, setCandSubmitting] = useState(false);

  const fetchRecruitmentData = async () => {
    setLoading(true);
    try {
      const [jobsRes, candsRes] = await Promise.all([
        recruitmentApi.getJobs(),
        recruitmentApi.getCandidates()
      ]);
      setJobs(jobsRes);
      setCandidates(candsRes);
      if (jobsRes.length > 0 && !candJobTitle) {
        setCandJobTitle(jobsRes[0].title);
      }
    } catch (err) {
      console.error('Error fetching recruitment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setJobSubmitting(true);
    try {
      await recruitmentApi.createJob({
        title: jobTitle,
        department,
        location,
        job_type: jobType,
        description: jobDesc
      });
      setIsJobModalOpen(false);
      setJobTitle('');
      setJobDesc('');
      await fetchRecruitmentData();
    } catch (err) {
      alert(err || 'Failed to create job posting.');
    } finally {
      setJobSubmitting(false);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      await recruitmentApi.toggleJobStatus(jobId, nextStatus);
      await fetchRecruitmentData();
    } catch (err) {
      alert(err || 'Failed to update job status.');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setCandSubmitting(true);
    try {
      await recruitmentApi.addCandidate({
        job_title: candJobTitle,
        name: candName,
        email: candEmail,
        phone: candPhone,
        stage: candStage,
        interviewer_notes: candNotes
      });
      setIsCandidateModalOpen(false);
      setCandName('');
      setCandEmail('');
      setCandPhone('');
      setCandNotes('');
      await fetchRecruitmentData();
    } catch (err) {
      alert(err || 'Failed to add candidate.');
    } finally {
      setCandSubmitting(false);
    }
  };

  const handleAdvanceStage = async (candidateId, currentStage) => {
    const stageOrder = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    const idx = stageOrder.indexOf(currentStage);
    if (idx === -1 || idx >= stageOrder.length - 1) return;

    const nextStage = stageOrder[idx + 1];
    try {
      await recruitmentApi.updateCandidateStage(candidateId, nextStage);
      await fetchRecruitmentData();
    } catch (err) {
      alert(err || 'Failed to advance stage.');
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    try {
      await recruitmentApi.updateCandidateStage(candidateId, 'Rejected', 'Rejected by HR Admin');
      await fetchRecruitmentData();
    } catch (err) {
      alert(err || 'Failed to update stage.');
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJob = selectedJobFilter === 'ALL' || c.job_title === selectedJobFilter;
    return matchesSearch && matchesJob;
  });

  const totalOpenJobs = jobs.filter((j) => j.status === 'Open').length;
  const totalApplied = candidates.filter((c) => c.stage === 'Applied').length;
  const totalInterviews = candidates.filter((c) => c.stage === 'Interview').length;
  const totalOffers = candidates.filter((c) => c.stage === 'Offer').length;
  const totalHired = candidates.filter((c) => c.stage === 'Hired').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider mb-3">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span>Recruitment & ATS Engine</span>
          </div>
          <h1 className="text-3xl font-black text-white">Talent Acquisition Hub</h1>
          <p className="text-slate-300 text-sm mt-1">Manage job openings, track candidate hiring pipelines, and issue job offers</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post Job Opening
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Aggregate Recruitment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="!p-4 border-t-4 border-t-purple-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Open Positions</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalOpenJobs}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-slate-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">New Applicants</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{totalApplied}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-purple-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">In Interview</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalInterviews}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-amber-500 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Offers Extended</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalOffers}</div>
        </Card>
        <Card className="!p-4 border-t-4 border-t-emerald-500 text-center col-span-2 md:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Hired Candidates</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalHired}</div>
        </Card>
      </div>

      {/* Control Navigation & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'kanban'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Candidate Pipeline (ATS)
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Active Job Openings ({jobs.length})
          </button>
        </div>

        {activeTab === 'kanban' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white shadow-sm"
              />
            </div>

            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white shadow-sm"
            >
              <option value="ALL">All Openings</option>
              {jobs.map((j) => (
                <option key={j._id} value={j.title}>{j.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'kanban' ? (
        /* Hiring Pipeline Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[220px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{stage.title}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div className="space-y-3 flex-1">
                  {stageCandidates.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[11px] font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No candidates
                    </div>
                  ) : (
                    stageCandidates.map((c) => (
                      <div key={c._id} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-2 hover:shadow-md transition-all">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                          {c.name}
                        </div>

                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 truncate">
                          {c.job_title}
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{c.email}</span>
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {c.phone}
                            </div>
                          )}
                        </div>

                        {c.interviewer_notes && (
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                            "{c.interviewer_notes}"
                          </div>
                        )}

                        {/* Stage Actions */}
                        {c.stage !== 'Hired' && c.stage !== 'Rejected' && (
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => handleRejectCandidate(c._id)}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              Reject
                            </button>

                            <button
                              onClick={() => handleAdvanceStage(c._id, c.stage)}
                              className="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              Advance <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Job Openings Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job._id} className="!p-5 hover:shadow-lg transition-all border-t-4 border-t-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" /> {job.department}
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-sky-500" /> {job.location}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  job.status === 'Open' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500'
                }`}>
                  {job.status}
                </span>
              </div>

              {job.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span className="text-purple-600 dark:text-purple-400 font-black text-sm">{job.applicants_count || 0}</span> Applicants
                </div>

                <button
                  onClick={() => handleToggleJobStatus(job._id, job.status)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    job.status === 'Open'
                      ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {job.status === 'Open' ? 'Close Opening' : 'Re-open Opening'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal 1: Post New Job Opening */}
      <Modal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="Post New Job Opening">
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Full-Stack Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Product">Product</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Description</label>
            <textarea
              rows={3}
              placeholder="Outline responsibilities and requirements..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsJobModalOpen(false)}
              className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={jobSubmitting}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {jobSubmitting ? 'Publishing...' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Candidate Application */}
      <Modal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} title="Register Candidate Application">
        <form onSubmit={handleAddCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Job Position</label>
            <select
              value={candJobTitle}
              onChange={(e) => setCandJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j.title}>{j.title} ({j.department})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Candidate Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={candEmail}
                onChange={(e) => setCandEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={candPhone}
                onChange={(e) => setCandPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Initial Pipeline Stage</label>
            <select
              value={candStage}
              onChange={(e) => setCandStage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            >
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer Extended</option>
              <option value="Hired">Hired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Interviewer / Initial Notes</label>
            <textarea
              rows={2}
              placeholder="Candidate background notes or interview feedback..."
              value={candNotes}
              onChange={(e) => setCandNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCandidateModalOpen(false)}
              className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={candSubmitting}
              className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {candSubmitting ? 'Registering...' : 'Register Applicant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
