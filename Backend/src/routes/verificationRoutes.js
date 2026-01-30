const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const StudentVerification = require('../models/StudentVerification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const Notification = require('../models/Notification');
const VerificationAudit = require('../models/VerificationAudit');

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

// Request college email verification (sends one-time link)
router.post('/request-college-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    // create verification record
    await StudentVerification.create({
      user: req.user._id,
      email,
      token,
      expiresAt
    });
    const domain = (email.split('@')[1] || '').toLowerCase();

    // Send verification email with link to backend verify endpoint
    const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/verification/verify-college-email?token=${token}`;
    await sendEmail(email, 'college_verification', { userName: req.user.name || req.user.email, verifyUrl });

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('request-college-email error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify via token (GET used for email click)
router.get('/verify-college-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token required');

    const record = await StudentVerification.findOne({ token });
    if (!record) return res.status(404).send('Invalid token');
    if (record.verified) return res.send('Already verified');
    if (record.expiresAt < new Date()) return res.status(400).send('Token expired');

    const user = await User.findById(record.user);
    if (!user) return res.status(404).send('User not found');

    // Mark verified
    record.verified = true;
    await record.save();

    // Determine domain and whether it's auto-approvable
    const domain = (record.email.split('@')[1] || '').toLowerCase();
    const allowedList = (process.env.ACADEMIC_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const domainRegex = new RegExp(process.env.ACADEMIC_DOMAIN_REGEX || '\\.(edu|ac\\.in)$', 'i');
    const domainAllowed = allowedList.includes(domain) || domainRegex.test(domain);

    // set college field to domain (optional)
    try { user.college = domain; } catch (e) {}

    if (domainAllowed) {
      // Auto-approve as verified student
      user.verificationState = 'verified_student';
      await user.save();

      // Audit
      try { await VerificationAudit.create({ user: user._id, action: 'verify_email', token, providerRef: null, ip: req.ip, userAgent: req.get('User-Agent') }); } catch (e) {}

      // Notify user
      try {
        await Notification.create({ user: user._id, type: 'system', title: 'College Verified', message: 'Your college email has been verified and you have been granted the student badge.' });
      } catch (e) {}

      return res.send(`<html><body><h2>College email verified and approved</h2><p>You may now return to the app.</p></body></html>`);
    } else {
      // Keep as email_verified pending admin approval
      user.verificationState = 'email_verified';
      await user.save();

      // Audit
      try { await VerificationAudit.create({ user: user._id, action: 'verify_email_pending', token, ip: req.ip, userAgent: req.get('User-Agent') }); } catch (e) {}

      // Notify admins (simple approach: create system notification for all admins)
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const a of admins) {
          await Notification.create({ user: a._id, type: 'system', title: 'College Email Verification Pending', message: `User ${user.email} verified their email ${record.email} and requires approval.`, metadata: { userId: user._id } });
        }
      } catch (e) { console.error('notify admins failed', e); }

      return res.send(`<html><body><h2>College email verified — pending admin approval</h2><p>An administrator will review your verification shortly.</p></body></html>`);
    }
  } catch (err) {
    console.error('verify-college-email error', err);
    return res.status(500).send('Server error');
  }
});

// Admin endpoints to approve/reject pending email verifications
router.post('/admin/approve-email', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId, token, reason } = req.body;
    const query = token ? { token } : { user: userId };
    const record = await StudentVerification.findOne(query);
    if (!record) return res.status(404).json({ success: false, message: 'Verification record not found' });

    const user = await User.findById(record.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.verificationState = 'verified_student';
    await user.save();

    try { await VerificationAudit.create({ user: user._id, admin: req.user._id, action: 'admin_approve_email', reason, token }); } catch (e) {}

    // notify user
    try { await Notification.create({ user: user._id, type: 'system', title: 'Verification Approved', message: 'An administrator has approved your college verification.' }); } catch (e) {}

    res.json({ success: true });
  } catch (e) {
    console.error('admin approve error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/admin/reject-email', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId, token, reason } = req.body;
    const query = token ? { token } : { user: userId };
    const record = await StudentVerification.findOne(query);
    if (!record) return res.status(404).json({ success: false, message: 'Verification record not found' });

    const user = await User.findById(record.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.verificationState = 'verification_failed';
    await user.save();

    try { await VerificationAudit.create({ user: user._id, admin: req.user._id, action: 'admin_reject_email', reason, token }); } catch (e) {}

    // notify user
    try { await Notification.create({ user: user._id, type: 'system', title: 'Verification Rejected', message: `Your college verification was rejected: ${reason || 'No reason provided'}` }); } catch (e) {}

    res.json({ success: true });
  } catch (e) {
    console.error('admin reject error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: list pending verifications (verified email but awaiting admin decision)
router.get('/admin/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const q = (req.query.q || '').trim();

    // Build aggregation to join user and filter by pending state
    const pipeline = [
      { $match: { verified: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.verificationState': 'email_verified' } }
    ];

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.email': regex },
            { 'user.name': regex },
            { email: regex }
          ]
        }
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    // Facet to get total count and paged results
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    });

    const result = await StudentVerification.aggregate(pipeline).allowDiskUse(true);
    const metadata = (result[0] && result[0].metadata && result[0].metadata[0]) || { total: 0 };
    const verifications = (result[0] && result[0].data) || [];

    return res.json({ success: true, verifications, total: metadata.total || 0, page, limit });
  } catch (e) {
    console.error('failed to fetch pending verifications', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

