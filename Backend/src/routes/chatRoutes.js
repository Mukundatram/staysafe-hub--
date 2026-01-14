const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get all conversations for the current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all unique conversations (unique property + other user combinations)
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

    // Populate property and user details
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        const property = await Property.findById(msg._id.property).select('title location images');
        const otherUser = await User.findById(msg._id.otherUser).select('name email role');
        return {
          property,
          otherUser,
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime,
          unreadCount: msg.unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation (property + user)
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

// Send a message
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

module.exports = router;
