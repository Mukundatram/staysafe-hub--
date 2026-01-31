import api from './api';

// Use explicit API paths to avoid baseURL resolution edge-cases
const aadhaarService = {
  requestOtp: async (aadhaarNumber) => {
    const response = await api.post('/aadhaar/request-otp', { aadhaarNumber });
    return response.data;
  },
  verifyOtp: async (requestId, otp) => {
    const response = await api.post('/aadhaar/verify-otp', { requestId, otp });
    return response.data;
  }
};

export default aadhaarService;
