import api from './api';

const verificationService = {
  requestCollegeEmail: async (email) => {
    const res = await api.post('/verification/request-college-email', { email });
    return res.data;
  },
  adminApproveEmail: async (payload) => {
    const res = await api.post('/verification/admin/approve-email', payload);
    return res.data;
  },
  adminRejectEmail: async (payload) => {
    const res = await api.post('/verification/admin/reject-email', payload);
    return res.data;
  }
  ,
  getPendingForAdmin: async (page = 1, limit = 10, q = '') => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    const res = await api.get(`/verification/admin/pending?${params.toString()}`);
    return res.data;
  }
};

export default verificationService;
