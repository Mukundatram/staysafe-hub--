import api from './api';

export const messService = {
  // Get all mess services with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(','));
        } else if (!Array.isArray(value)) {
          params.append(key, value);
        }
      }
    });
    const response = await api.get(`/mess?${params.toString()}`);
    return response.data;
  },

  // Get single mess service by ID
  getById: async (id) => {
    const response = await api.get(`/mess/${id}`);
    return response.data;
  },

  // Create new mess service (Owner)
  create: async (messData, images) => {
    const formData = new FormData();

    // Add text fields
    formData.append('name', messData.name);
    formData.append('description', messData.description || '');
    formData.append('location', messData.location);
    formData.append('address', messData.address || '');
    formData.append('contactPhone', messData.contactPhone);
    formData.append('contactEmail', messData.contactEmail || '');

    // Add JSON fields
    if (messData.coordinates) {
      formData.append('coordinates', JSON.stringify(messData.coordinates));
    }
    if (messData.mealTypes) {
      formData.append('mealTypes', JSON.stringify(messData.mealTypes));
    }
    if (messData.cuisineType) {
      formData.append('cuisineType', JSON.stringify(messData.cuisineType));
    }
    if (messData.menu) {
      formData.append('menu', JSON.stringify(messData.menu));
    }
    if (messData.pricing) {
      formData.append('pricing', JSON.stringify(messData.pricing));
    }
    if (messData.timings) {
      formData.append('timings', JSON.stringify(messData.timings));
    }
    if (messData.features) {
      formData.append('features', JSON.stringify(messData.features));
    }
    if (messData.maxSubscribers) {
      formData.append('maxSubscribers', messData.maxSubscribers);
    }

    // Add images
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/mess', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update mess service (Owner)
  update: async (id, messData) => {
    const response = await api.put(`/mess/${id}`, messData);
    return response.data;
  },

  // Delete mess service (Owner)
  delete: async (id) => {
    const response = await api.delete(`/mess/${id}`);
    return response.data;
  },

  // Get owner's mess services
  getMyServices: async () => {
    const response = await api.get('/mess/owner/my-services');
    return response.data;
  },

  // Subscribe to mess service
  subscribe: async (messId, subscriptionData) => {
    const response = await api.post(`/mess/${messId}/subscribe`, subscriptionData);
    return response.data;
  },

  // Get user's subscriptions
  getMySubscriptions: async () => {
    const response = await api.get('/mess/subscriptions/my');
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    const response = await api.patch(`/mess/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  },

  // Get subscribers (Owner)
  getSubscribers: async (messId) => {
    const response = await api.get(`/mess/${messId}/subscribers`);
    return response.data;
  },

  // Approve subscription (Owner)
  approveSubscription: async (subscriptionId) => {
    const response = await api.patch(`/mess/subscriptions/${subscriptionId}/approve`);
    return response.data;
  },

  // Reject subscription (Owner)
  rejectSubscription: async (subscriptionId, reason = '') => {
    const response = await api.patch(`/mess/subscriptions/${subscriptionId}/reject`, { reason });
    return response.data;
  },

  // Get all subscription requests for owner's mess services
  getOwnerSubscriptions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    const response = await api.get(`/mess/owner/subscriptions?${queryParams.toString()}`);
    return response.data;
  },

  // Toggle mess active status (soft delete/restore)
  toggleActive: async (id) => {
    const response = await api.delete(`/mess/${id}`);
    return response.data;
  }
};

export default messService;
