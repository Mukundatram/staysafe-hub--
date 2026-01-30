const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

// GET /api/user/me - return current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      college: user.college,
      studentId: user.studentId,
      avatar: user.avatar,
      verificationState: user.verificationState
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/me - update profile (limited fields)
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'avatar', 'college', 'studentId'];
    const updates = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // If phone changed, mark as unverified
    if (updates.phone) {
      const existing = req.user.phone;
      if (!existing || existing !== updates.phone) {
        updates.phoneVerified = false;
        updates.phoneVerifiedAt = undefined;
      }
    }

    const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user: {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      phoneVerified: updated.phoneVerified,
      college: updated.college,
      studentId: updated.studentId,
      avatar: updated.avatar
    }});
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
