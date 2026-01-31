import api from './api';

export const messAdminService = {
    // Get all mess services (admin)
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });
        const response = await api.get(`/admin/mess?${queryParams.toString()}`);
        return response.data;
    },

    // Verify hygiene rating
    verifyHygiene: async (messId, hygieneRating) => {
        const response = await api.patch(`/admin/mess/${messId}/verify-hygiene`, { hygieneRating });
        return response.data;
    },

    // Toggle active status
    toggleActive: async (messId) => {
        const response = await api.patch(`/admin/mess/${messId}/toggle-active`);
        return response.data;
    },

    // Get all subscriptions
    getSubscriptions: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });
        const response = await api.get(`/admin/mess/subscriptions?${queryParams.toString()}`);
        return response.data;
    },

    // Get audit logs
    getAuditLogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });
        const response = await api.get(`/admin/mess/audits?${queryParams.toString()}`);
        return response.data;
    },

    // Get statistics
    getStats: async () => {
        const response = await api.get('/admin/mess/stats');
        return response.data;
    }
};

export default messAdminService;
