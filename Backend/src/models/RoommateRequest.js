const mongoose = require('mongoose');
const { ROOMMATE } = require('../config/constants');

const roommateRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 500,
        trim: true
    },
    respondedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    // Cooldown tracking
    canRequestAgainAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate requests
roommateRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Indexes for queries
roommateRequestSchema.index({ receiver: 1, status: 1 });
roommateRequestSchema.index({ sender: 1, status: 1 });
roommateRequestSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if request is expired
roommateRequestSchema.virtual('isExpired').get(function () {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Pre-save middleware to set expiration date (30 days from creation)
roommateRequestSchema.pre('save', function (next) {
    if (this.isNew && !this.expiresAt) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + ROOMMATE.REQUEST_EXPIRY_DAYS);
        this.expiresAt = expiryDate;
    }
    next();
});

// Static method to check if cooldown is active
roommateRequestSchema.statics.checkCooldown = async function (senderId, receiverId) {
    const existingRequest = await this.findOne({
        sender: senderId,
        receiver: receiverId,
        status: 'rejected'
    }).sort({ respondedAt: -1 });

    if (existingRequest && existingRequest.canRequestAgainAt) {
        if (new Date() < existingRequest.canRequestAgainAt) {
            return {
                onCooldown: true,
                canRequestAt: existingRequest.canRequestAgainAt
            };
        }
    }

    return { onCooldown: false };
};

// Static method to get pending requests for user
roommateRequestSchema.statics.getPendingForUser = function (userId) {
    return this.find({
        receiver: userId,
        status: 'pending',
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    })
        .populate('sender', 'name email profilePicture isVerified')
        .sort({ createdAt: -1 });
};

// Static method to get sent requests
roommateRequestSchema.statics.getSentByUser = function (userId) {
    return this.find({
        sender: userId
    })
        .populate('receiver', 'name email profilePicture isVerified')
        .sort({ createdAt: -1 });
};

// Static method to check if connection exists (accepted)
roommateRequestSchema.statics.areConnected = async function (userId1, userId2) {
    const connection = await this.findOne({
        $or: [
            { sender: userId1, receiver: userId2, status: 'accepted' },
            { sender: userId2, receiver: userId1, status: 'accepted' }
        ]
    });

    return !!connection;
};

// Static method to get all connections for user
roommateRequestSchema.statics.getConnections = function (userId) {
    return this.find({
        $or: [
            { sender: userId, status: 'accepted' },
            { receiver: userId, status: 'accepted' }
        ]
    })
        .populate('sender', 'name email profilePicture isVerified phone')
        .populate('receiver', 'name email profilePicture isVerified phone')
        .sort({ respondedAt: -1 });
};

// Instance method to accept request
roommateRequestSchema.methods.accept = async function () {
    this.status = 'accepted';
    this.respondedAt = new Date();
    await this.save();

    // Update connection count in profiles
    const RoommateProfile = mongoose.model('RoommateProfile');
    await RoommateProfile.updateOne(
        { user: this.sender },
        { $inc: { connectionCount: 1 } }
    );
    await RoommateProfile.updateOne(
        { user: this.receiver },
        { $inc: { connectionCount: 1 } }
    );

    return this;
};

// Instance method to reject request (sets cooldown)
roommateRequestSchema.methods.reject = async function () {
    this.status = 'rejected';
    this.respondedAt = new Date();

    // Set cooldown period
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() + ROOMMATE.REQUEST_COOLDOWN_DAYS);
    this.canRequestAgainAt = cooldownDate;

    await this.save();
    return this;
};

// Instance method to block (permanent)
roommateRequestSchema.methods.block = async function () {
    this.status = 'blocked';
    this.respondedAt = new Date();
    await this.save();

    // Add to blocked list in profile
    const RoommateProfile = mongoose.model('RoommateProfile');
    await RoommateProfile.updateOne(
        { user: this.receiver },
        { $addToSet: { blockedUsers: this.sender } }
    );

    return this;
};

const RoommateRequest = mongoose.model('RoommateRequest', roommateRequestSchema);

module.exports = RoommateRequest;
