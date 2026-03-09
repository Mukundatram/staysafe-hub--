const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();

// In-memory OTP store: phone -> { otp, expiresAt }
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSmsOtp(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    // Fallback for development — log to console
    console.log(`[MockSMS] OTP ${otp} → ${phone} (set FAST2SMS_API_KEY to send real SMS)`);
    return;
  }

  // Strip country code if present (Fast2SMS needs 10-digit Indian number)
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',                   // Quick SMS (transactional)
        message: `Your StaySafe Hub phone verification OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        language: 'english',
        flash: 0,
        numbers: cleanPhone
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.return === true) {
      console.log(`[SMS] OTP sent to ${cleanPhone} via Fast2SMS`);
    } else {
      console.error('[SMS] Fast2SMS error:', response.data);
      throw new Error(response.data?.message || 'SMS sending failed');
    }
  } catch (err) {
    console.error('[SMS] Failed to send OTP:', err.response?.data || err.message);
    throw err;
  }
}

// POST /api/phone/request-otp
router.post('/request-otp', authenticate, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone required' });

    const otp = genOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    otpStore.set(phone, { otp, expiresAt });

    await sendSmsOtp(phone, otp);

    return res.json({ message: 'OTP sent to your mobile number' });
  } catch (err) {
    console.error('request-otp error', err);
    // Still respond success to avoid revealing whether the number is valid
    // but include note if SMS failed
    if (err.response?.data || err.message?.includes('SMS')) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
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
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (entry.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Mark user's phone as verified
    const user = req.user;
    user.phone = phone;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    await user.save();

    otpStore.delete(phone);
    res.json({ message: 'Phone verified successfully', phone: user.phone });
  } catch (err) {
    console.error('verify-otp error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

