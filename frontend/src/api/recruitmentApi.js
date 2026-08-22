import axiosClient from './axiosClient';

export const recruitmentApi = {
  getJobs: () => axiosClient.get('/recruitment/jobs'),
  createJob: (jobData) => axiosClient.post('/recruitment/jobs', jobData),
  toggleJobStatus: (jobId, newStatus) => axiosClient.put(`/recruitment/jobs/${jobId}/status?new_status=${newStatus}`),
  getCandidates: () => axiosClient.get('/recruitment/candidates'),
  addCandidate: (candidateData) => axiosClient.post('/recruitment/candidates', candidateData),
  updateCandidateStage: (candidateId, stage, interviewerNotes = '') =>
    axiosClient.put(`/recruitment/candidates/${candidateId}/stage`, { stage, interviewer_notes: interviewerNotes }),
};
