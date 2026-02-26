const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Optional - for property chat
  mess: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' }, // Optional - for mess chat
  content: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Validation: property and mess are now optional to support roommate direct messages
// No pre-save validation needed

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, property: 1 });
messageSchema.index({ sender: 1, receiver: 1, mess: 1 });
messageSchema.index({ createdAt: -1 });

// Index for roommate direct messages (messages without property or mess)
messageSchema.index(
  { sender: 1, receiver: 1, createdAt: -1 },
  {
    partialFilterExpression: {
      property: { $exists: false },
      mess: { $exists: false }
    }
  }
);

module.exports = mongoose.model('Message', messageSchema);
