// Mock Aadhaar provider implementation (kept out of main service to allow adapter switching)
const crypto = require('crypto');

// In-memory store: requestId -> { otp, expiresAt }
const store = new Map();

function generateRequestId() {
  return crypto.randomBytes(12).toString('hex');
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requestOtp(aadhaarNumber) {
  if (!/^[0-9]{12}$/.test(aadhaarNumber)) {
    const err = new Error('Invalid Aadhaar number format');
    err.code = 'INVALID_AADHAAR';
    throw err;
  }

  const requestId = generateRequestId();
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  store.set(requestId, { otp, expiresAt });

  const providerRef = `mock-aadhaar-${requestId}`;

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.log(`[AADHAAR-MOCK] OTP for request ${requestId}: ${otp}`);
  }

  return { requestId, providerRef };
}

async function verifyOtp(requestId, otp) {
  const rec = store.get(requestId);
  if (!rec) {
    const err = new Error('Invalid or expired requestId');
    err.code = 'INVALID_REQUEST';
    throw err;
  }

  if (Date.now() > rec.expiresAt) {
    store.delete(requestId);
    const err = new Error('OTP expired');
    err.code = 'OTP_EXPIRED';
    throw err;
  }

  if (rec.otp !== otp) {
    const err = new Error('Invalid OTP');
    err.code = 'INVALID_OTP';
    throw err;
  }

  store.delete(requestId);

  return { providerRef: `mock-aadhaar-${requestId}` };
}

module.exports = { requestOtp, verifyOtp };
