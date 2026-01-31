import api from './api';

const phoneService = {
  requestOtp: async (phone) => {
    const res = await api.post('/phone/request-otp', { phone });
    return res.data;
  },
  verifyOtp: async (phone, otp) => {
    const res = await api.post('/phone/verify-otp', { phone, otp });
    return res.data;
  }
};

export default phoneService;
