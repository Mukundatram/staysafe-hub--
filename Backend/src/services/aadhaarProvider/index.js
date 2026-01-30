// Adapter to select Aadhaar provider implementation based on env
const providerName = (process.env.AADHAAR_PROVIDER || 'mock').toLowerCase();

let impl;
try {
  if (providerName === 'mock') {
    impl = require('./mockProvider');
  } else {
    // Attempt to load a provider module by name (e.g., digio, idfy)
    impl = require(`./${providerName}`);
  }
} catch (e) {
  console.error(`[aadhaarProvider] Failed to load provider '${providerName}', falling back to mock.`, e.message || e);
  impl = require('./mockProvider');
}

// Normalize interface: requestOtp(aadhaarNumber) => { requestId, providerRef }
// verifyOtp(requestId, otp) => { providerRef }
module.exports = {
  requestOtp: impl.requestOtp,
  verifyOtp: impl.verifyOtp
};
