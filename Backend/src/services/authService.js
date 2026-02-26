const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { sendEmail } = require('./emailService');
const { AUTH, OTP } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a random 6-digit OTP string.
 */
function generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Issue a signed JWT for a user.
 * Centralised here so register, login, and Google all share the same logic.
 */
function issueToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: AUTH.JWT_EXPIRES_IN }
    );
}

/**
 * Step 1 of registration: create a PendingUser and send OTP email.
 * Returns the pendingUser id.
 */
async function createPendingUser({ name, email, password, role }) {
    // Check if a real user already exists
    const existing = await User.findOne({ email });
    if (existing) {
        const err = new Error('User already exists');
        err.status = 409;
        throw err;
    }

    // BUSINESS LOGIC: Enforce a single admin across the platform
    if (role === 'admin') {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            const err = new Error('Registration failed: An admin already exists on the platform.');
            err.status = 403;
            throw err;
        }
    }

    const passwordHash = await bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 4); // light hash, OTP is short-lived

    // Upsert so re-registering the same email before verification just refreshes the OTP
    const pending = await PendingUser.findOneAndUpdate(
        { email },
        {
            name,
            email,
            passwordHash,
            role,
            otp: otpHash,
            otpExpiresAt: new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000),
            attempts: 0,
            createdAt: new Date() // reset TTL
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email (fire-and-forget, don't block the response)
    sendEmail(email, 'email_otp', { userName: name, otp }).catch(err =>
        console.error('Failed to send OTP email:', err.message)
    );

    return pending._id;
}

/**
 * Step 2 of registration: validate the OTP and create the real User.
 * Returns { token, user }.
 */
async function verifyOtp(pendingUserId, otp) {
    const pending = await PendingUser.findById(pendingUserId);
    if (!pending) {
        const err = new Error('Registration expired or not found. Please register again.');
        err.status = 404;
        throw err;
    }

    // Check max attempts
    if (pending.attempts >= OTP.MAX_ATTEMPTS) {
        const err = new Error('Too many attempts. Please register again.');
        err.status = 429;
        throw err;
    }

    // Check expiry
    if (pending.otpExpiresAt < new Date()) {
        const err = new Error('OTP has expired. Please request a new one.');
        err.status = 410;
        throw err;
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, pending.otp);
    if (!isMatch) {
        pending.attempts += 1;
        await pending.save();
        const remaining = OTP.MAX_ATTEMPTS - pending.attempts;
        const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        err.status = 400;
        throw err;
    }

    // OTP is valid — create the real user
    const user = new User({
        name: pending.name,
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: pending.role,
        emailVerified: true
    });
    await user.save();

    // Clean up pending
    await PendingUser.deleteOne({ _id: pending._id });

    const token = issueToken(user);
    return {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };
}

/**
 * Resend OTP to a pending user.
 */
async function resendOtp(pendingUserId) {
    const pending = await PendingUser.findById(pendingUserId);
    if (!pending) {
        const err = new Error('Registration expired or not found. Please register again.');
        err.status = 404;
        throw err;
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 4);

    pending.otp = otpHash;
    pending.otpExpiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);
    pending.attempts = 0;
    await pending.save();

    sendEmail(pending.email, 'email_otp', { userName: pending.name, otp }).catch(err =>
        console.error('Failed to resend OTP email:', err.message)
    );

    return { message: 'A new OTP has been sent to your email.' };
}

module.exports = {
    generateOtp,
    issueToken,
    createPendingUser,
    verifyOtp,
    resendOtp
};
