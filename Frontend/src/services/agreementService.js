import api from './api';

const agreementService = {
  // Create agreement for a booking
  createAgreement: async (agreementData) => {
    const response = await api.post('/agreements/create', agreementData);
    return response.data;
  },

  // Get my agreements
  getMyAgreements: async (role = 'all', status = '') => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    const response = await api.get(`/agreements/my-agreements?${params.toString()}`);
    return response.data;
  },

  // Get agreement by ID
  getAgreement: async (id) => {
    const response = await api.get(`/agreements/${id}`);
    return response.data;
  },

  // Get agreement by booking ID
  getAgreementByBooking: async (bookingId) => {
    const response = await api.get(`/agreements/booking/${bookingId}`);
    return response.data;
  },

  // Sign agreement
  signAgreement: async (id, signatureData = '') => {
    const response = await api.post(`/agreements/${id}/sign`, { signatureData });
    return response.data;
  },

  // Update agreement
  updateAgreement: async (id, updateData) => {
    const response = await api.patch(`/agreements/${id}`, updateData);
    return response.data;
  },

  // Terminate agreement
  terminateAgreement: async (id, reason) => {
    const response = await api.post(`/agreements/${id}/terminate`, { reason });
    return response.data;
  },

  // Cancel/delete agreement
  cancelAgreement: async (id) => {
    const response = await api.delete(`/agreements/${id}`);
    return response.data;
  }
};

export default agreementService;
