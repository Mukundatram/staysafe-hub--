const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String, 
    maxlength: 500 
  }
}, { timestamps: true });

// Ensure a user can only add a property once
wishlistSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
