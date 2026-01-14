import api from './api';

const analyticsService = {
  // Owner: Get dashboard analytics
  getOwnerStats: async () => {
    const response = await api.get('/analytics/owner/stats');
    return response.data;
  },

  // Admin: Get platform analytics
  getAdminStats: async () => {
    const response = await api.get('/analytics/admin/stats');
    return response.data;
  }
};

export default analyticsService;
