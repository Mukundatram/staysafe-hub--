const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const aadhaarService = require('../services/aadhaarService');
const User = require('../models/User');

// Request Aadhaar OTP - Aadhaar number must NOT be stored
router.post('/request-otp', authenticate, async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber) return res.status(400).json({ success: false, message: 'Aadhaar number required' });

    // Service validates format but does not persist number
    const { requestId, providerRef } = await aadhaarService.requestOtp(aadhaarNumber);

    // Return requestId to client; do NOT return or store the aadhaarNumber
    res.json({ success: true, requestId, providerRef });
  } catch (error) {
    console.error('Aadhaar request error', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Verify Aadhaar OTP
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { requestId, otp } = req.body;
    if (!requestId || !otp) return res.status(400).json({ success: false, message: 'requestId and otp required' });

    const result = await aadhaarService.verifyOtp(requestId, otp);

    // Update user record: set aadhaarVerification metadata (no aadhaar number stored)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.aadhaarVerification = user.aadhaarVerification || {};
    user.aadhaarVerification.verified = true;
    user.aadhaarVerification.verifiedAt = new Date();
    user.aadhaarVerification.providerRef = result.providerRef;
    user.verificationState = 'aadhaar_verified';

    await user.save();

    res.json({ success: true, message: 'Aadhaar verified' });
  } catch (error) {
    console.error('Aadhaar verify error', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
