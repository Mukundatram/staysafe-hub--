const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Optional - for property chat
  mess: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' }, // Optional - for mess chat
  content: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Validation: must have either property or mess reference
messageSchema.pre('save', function (next) {
  if (!this.property && !this.mess) {
    return next(new Error('Message must have either property or mess reference'));
  }
  next();
});

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, property: 1 });
messageSchema.index({ sender: 1, receiver: 1, mess: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
