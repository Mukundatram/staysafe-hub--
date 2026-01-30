const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// In-memory OTP store for dev: phone -> { otp, expiresAt }
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/phone/request-otp
router.post('/request-otp', authenticate, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone required' });

    const otp = genOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    otpStore.set(phone, { otp, expiresAt });

    // In production: send SMS via provider. For dev, log OTP.
    console.log(`[MockOTP] send OTP ${otp} to ${phone} (expires in 5m)`);

    return res.json({ message: 'OTP sent (mocked)' });
  } catch (err) {
    console.error('request-otp error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/phone/verify-otp
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'phone and otp required' });

    const entry = otpStore.get(phone);
    if (!entry) return res.status(400).json({ message: 'No OTP requested for this number' });
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (entry.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Mark user's phone verified and persist phone if not set
    const user = req.user;
    user.phone = phone;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    await user.save();

    // remove OTP
    otpStore.delete(phone);

    res.json({ message: 'Phone verified', phone: user.phone });
  } catch (err) {
    console.error('verify-otp error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
