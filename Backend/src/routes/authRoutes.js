const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const { AUTH } = require('../config/constants');
const { issueToken, createPendingUser, verifyOtp, resendOtp } = require('../services/authService');
const { sendEmail } = require('../services/emailService');

// Google OAuth (Passport)
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/google/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) return done(null, false);

      // Read role from state (passed via Google auth start)
      let role = req.query.state || 'student';
      const validRole = AUTH.VALID_ROLES.includes(role) ? role : 'student';
      role = validRole;

      let user = await User.findOne({ email });
      if (!user) {
        // BUSINESS LOGIC: Enforce a single admin across the platform
        if (role === 'admin') {
          const adminExists = await User.findOne({ role: 'admin' });
          if (adminExists) {
            console.log(`Google Auth: Admin already exists. Downgrading new user ${email} to student.`);
            role = 'student'; // Silently downgrade to student
          }
        }

        // Create new user with selected role — Google-verified email
        const randomPass = require('crypto').randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPass, AUTH.BCRYPT_SALT_ROUNDS);
        user = new User({
          name: profile.displayName || email.split('@')[0],
          email,
          passwordHash,
          role: role,
          emailVerified: true   // Google already verified the email
        });
        await user.save();
      } else if (!user.emailVerified) {
        // Existing user signing in with Google — mark email as verified
        user.emailVerified = true;
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

// ==================== REGISTER (Step 1: send OTP) ====================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (!AUTH.VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const pendingUserId = await createPendingUser({ name, email, password, role });
    res.json({
      success: true,
      message: 'Verification code sent to your email',
      pendingUserId
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
});

// ==================== VERIFY OTP (Step 2: create user) ====================
router.post('/verify-otp', async (req, res) => {
  try {
    const { pendingUserId, otp } = req.body;
    if (!pendingUserId || !otp) {
      return res.status(400).json({ success: false, message: 'Pending user ID and OTP are required' });
    }

    const result = await verifyOtp(pendingUserId, otp);
    res.json({
      success: true,
      message: 'Email verified. Registration complete!',
      ...result
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
});

// ==================== RESEND OTP ====================
router.post('/resend-otp', async (req, res) => {
  try {
    const { pendingUserId } = req.body;
    if (!pendingUserId) {
      return res.status(400).json({ success: false, message: 'Pending user ID is required' });
    }

    const result = await resendOtp(pendingUserId);
    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = issueToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GOOGLE AUTH ====================
router.get('/google', (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ message: 'Google OAuth not configured' });
  }
  // Pass role as state so the callback can read it
  const role = req.query.role || 'student';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: role
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.redirect(`${FRONTEND_URL}/login`);
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${FRONTEND_URL}/login`);
    const token = issueToken(user);
    const redirectTo = `${FRONTEND_URL}/auth/google/success?token=${token}`;
    return res.redirect(redirectTo);
  })(req, res, next);
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = expiresAt;
    await user.save();

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    sendEmail(email, 'forgot_password', { userName: user.name, resetUrl }).catch(err =>
      console.error('Failed to send password reset email:', err.message)
    );

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, AUTH.BCRYPT_SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

