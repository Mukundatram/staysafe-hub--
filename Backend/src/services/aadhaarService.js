// Aadhaar service delegates to a pluggable provider implementation.
const provider = require('./aadhaarProvider');

async function requestOtp(aadhaarNumber) {
  return provider.requestOtp(aadhaarNumber);
}

async function verifyOtp(requestId, otp) {
  return provider.verifyOtp(requestId, otp);
}

module.exports = {
  requestOtp,
  verifyOtp
};
