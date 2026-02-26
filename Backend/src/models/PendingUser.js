const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'owner', 'admin'], required: true },
    otp: { type: String, required: true },          // bcrypt-hashed
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL: auto-delete after 1 hour
});

// The unique: true on the email field already creates the index, no need to declare it again.

module.exports = mongoose.model('PendingUser', pendingUserSchema);
