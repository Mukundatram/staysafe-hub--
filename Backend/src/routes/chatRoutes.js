const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Property = require('../models/Property');
const Mess = require('../models/Mess');
const MessSubscription = require('../models/MessSubscription');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ==================== PROPERTY CHAT ROUTES ====================

// Get all conversations for the current user (property and mess combined)
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all unique conversations (unique property/mess + other user combinations)
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            property: '$property',
            mess: '$mess',
            otherUser: {
              $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender']
            }
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Populate property/mess and user details
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        let property = null;
        let mess = null;

        if (msg._id.property) {
          property = await Property.findById(msg._id.property).select('title location images');
        }
        if (msg._id.mess) {
          mess = await Mess.findById(msg._id.mess).select('name location images');
        }

        const otherUser = await User.findById(msg._id.otherUser).select('name email role');
        return {
          property,
          mess,
          otherUser,
          otherUserId: msg._id.otherUser,
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime,
          unreadCount: msg.unreadCount,
          type: msg._id.mess ? 'mess' : 'property'
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific property conversation
router.get('/:propertyId/:userId', protect, async (req, res) => {
  try {
    const { propertyId, userId } = req.params;
    const currentUserId = req.user._id;

    // Verify user is part of this conversation
    const messages = await Message.find({
      property: propertyId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    // Mark messages as read
    await Message.updateMany(
      {
        property: propertyId,
        sender: userId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message (property-based)
router.post('/send', protect, async (req, res) => {
  try {
    const { receiverId, propertyId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !propertyId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      property: propertyId,
      content
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'name role');
    await message.populate('receiver', 'name role');

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error('Error counting unread messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE conversation messages for a property + other user
router.delete('/:propertyId/:userId', protect, async (req, res) => {
  try {
    const { propertyId, userId } = req.params;
    const currentUserId = req.user._id;

    const result = await Message.deleteMany({
      property: propertyId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    return res.json({ message: 'Conversation removed', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ==================== MESS CHAT ROUTES ====================

// Get mess-based conversations
router.get('/mess/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all unique mess conversations
    const messages = await Message.aggregate([
      {
        $match: {
          mess: { $exists: true, $ne: null },
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            mess: '$mess',
            otherUser: {
              $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender']
            }
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Populate mess and user details
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        const mess = await Mess.findById(msg._id.mess).select('name location images');
        const otherUser = await User.findById(msg._id.otherUser).select('name email role');
        return {
          mess,
          otherUser,
          otherUserId: msg._id.otherUser,
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime,
          unreadCount: msg.unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching mess conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific mess conversation
router.get('/mess/:messId/:userId', protect, async (req, res) => {
  try {
    const { messId, userId } = req.params;
    const currentUserId = req.user._id;

    // Verify approved subscription exists (for student) or ownership (for owner)
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ message: 'Mess not found' });
    }

    const isOwner = mess.owner.toString() === currentUserId.toString();

    if (!isOwner) {
      // Check if student has an approved subscription
      const subscription = await MessSubscription.findOne({
        user: currentUserId,
        mess: messId,
        status: 'Active'
      });

      if (!subscription) {
        return res.status(403).json({ message: 'Chat only available for approved subscriptions' });
      }
    }

    // Get messages
    const messages = await Message.find({
      mess: messId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    // Mark messages as read
    await Message.updateMany(
      {
        mess: messId,
        sender: userId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error('Error fetching mess messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a mess-based message (only if subscription approved)
router.post('/mess/send', protect, async (req, res) => {
  try {
    const { receiverId, messId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !messId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify mess exists
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ message: 'Mess not found' });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify messaging is allowed (approved subscription or owner)
    const isOwner = mess.owner.toString() === senderId.toString();
    const isReceiverOwner = mess.owner.toString() === receiverId.toString();

    if (!isOwner) {
      // Sender is a student - check for approved subscription
      const subscription = await MessSubscription.findOne({
        user: senderId,
        mess: messId,
        status: 'Active'
      });

      if (!subscription) {
        return res.status(403).json({ message: 'Chat only available for approved subscriptions' });
      }
    } else {
      // Sender is owner - verify receiver has approved subscription
      const subscription = await MessSubscription.findOne({
        user: receiverId,
        mess: messId,
        status: 'Active'
      });

      if (!subscription) {
        return res.status(403).json({ message: 'Can only chat with approved subscribers' });
      }
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      mess: messId,
      content
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'name role');
    await message.populate('receiver', 'name role');

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${receiverId}`).emit('mess:message:new', { message, messId });
      }
    } catch (emitErr) {
      console.error('Socket emit error (messMessage):', emitErr);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending mess message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE mess conversation messages
router.delete('/mess/:messId/:userId', protect, async (req, res) => {
  try {
    const { messId, userId } = req.params;
    const currentUserId = req.user._id;

    const result = await Message.deleteMany({
      mess: messId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    return res.json({ message: 'Conversation removed', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting mess conversation:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
