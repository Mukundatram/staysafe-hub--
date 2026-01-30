const mongoose = require('mongoose');

const messSubscriptionAuditSchema = new mongoose.Schema({
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessSubscription',
        required: true
    },
    mess: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mess',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['APPROVED', 'REJECTED'],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
messSubscriptionAuditSchema.index({ subscription: 1 });
messSubscriptionAuditSchema.index({ mess: 1, createdAt: -1 });
messSubscriptionAuditSchema.index({ performedBy: 1 });
messSubscriptionAuditSchema.index({ student: 1 });

module.exports = mongoose.model('MessSubscriptionAudit', messSubscriptionAuditSchema);
