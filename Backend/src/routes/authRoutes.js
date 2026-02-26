const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const { AUTH } = require('../config/constants');
const { issueToken, createPendingUser, verifyOtp, resendOtp } = require('../services/authService');

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

module.exports = router;
