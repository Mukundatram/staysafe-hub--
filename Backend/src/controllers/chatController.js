const Message = require('../models/Message');
const Property = require('../models/Property');
const Mess = require('../models/Mess');
const MessSubscription = require('../models/MessSubscription');
const User = require('../models/User');
const RoommateRequest = require('../models/RoommateRequest');

// ==================== ROOMMATE CHAT ====================

/**
 * GET /roommate/conversations
 * Get all roommate conversations for the current user.
 */
exports.getRoommateConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all accepted connections
        const connections = await RoommateRequest.getConnections(userId);

        // Get last message for each connection
        const conversations = await Promise.all(
            connections.map(async (conn) => {
                const otherUserId = conn.sender._id.toString() === userId.toString()
                    ? conn.receiver._id
                    : conn.sender._id;

                const otherUser = conn.sender._id.toString() === userId.toString()
                    ? conn.receiver
                    : conn.sender;

                const lastMessage = await Message.findOne({
                    property: { $exists: false },
                    mess: { $exists: false },
                    $or: [
                        { sender: userId, receiver: otherUserId },
                        { sender: otherUserId, receiver: userId }
                    ]
                }).sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    sender: otherUserId,
                    receiver: userId,
                    read: false,
                    property: { $exists: false },
                    mess: { $exists: false }
                });

                return {
                    connectionId: conn._id,
                    otherUser,
                    otherUserId,
                    lastMessage: lastMessage?.content,
                    lastMessageTime: lastMessage?.createdAt,
                    unreadCount,
                    type: 'roommate'
                };
            })
        );

        const conversationsWithMessages = conversations.filter(c => c.lastMessage);
        res.json(conversationsWithMessages);
    } catch (err) {
        console.error('Error fetching roommate conversations:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /roommate/:roommateId
 * Get messages with a specific roommate (connection required).
 */
exports.getRoommateMessages = async (req, res) => {
    try {
        const { roommateId } = req.params;
        const currentUserId = req.user._id;

        const areConnected = await RoommateRequest.areConnected(currentUserId, roommateId);
        if (!areConnected) {
            return res.status(403).json({ message: 'You must be connected to chat with this user' });
        }

        const messages = await Message.find({
            property: { $exists: false },
            mess: { $exists: false },
            $or: [
                { sender: currentUserId, receiver: roommateId },
                { sender: roommateId, receiver: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture');

        // Mark as read
        await Message.updateMany(
            {
                sender: roommateId,
                receiver: currentUserId,
                read: false,
                property: { $exists: false },
                mess: { $exists: false }
            },
            { read: true }
        );

        res.json(messages);
    } catch (err) {
        console.error('Error fetching roommate messages:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /roommate/send
 * Send a message to a connected roommate.
 */
exports.sendRoommateMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Receiver ID and content are required' });
        }

        const areConnected = await RoommateRequest.areConnected(senderId, receiverId);
        if (!areConnected) {
            return res.status(403).json({ message: 'You must be connected to send messages' });
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await message.save();
        await message.populate('sender receiver', 'name profilePicture');

        // Emit socket event
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${receiverId}`).emit('roommate:message:new', { message });
            }
        } catch (emitErr) {
            console.error('Socket emit error (roommate message):', emitErr);
        }

        res.status(201).json(message);
    } catch (err) {
        console.error('Error sending roommate message:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== PROPERTY CHAT ====================

/**
 * GET /conversations
 * Get all property/mess conversations.
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            { $sort: { createdAt: -1 } },
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
            { $sort: { lastMessageTime: -1 } }
        ]);

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
};

/**
 * GET /:propertyId/:userId
 * Get messages for a specific property conversation.
 */
exports.getPropertyMessages = async (req, res) => {
    try {
        const { propertyId, userId } = req.params;
        const currentUserId = req.user._id;

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
};

/**
 * POST /send
 * Send a property-based message.
 */
exports.sendPropertyMessage = async (req, res) => {
    try {
        const { receiverId, propertyId, content } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !propertyId || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

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
        await message.populate('sender', 'name role');
        await message.populate('receiver', 'name role');

        res.status(201).json(message);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /unread-count
 * Get total unread message count.
 */
exports.getUnreadCount = async (req, res) => {
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
};

/**
 * DELETE /:propertyId/:userId
 * Delete conversation messages for a property + other user.
 */
exports.deletePropertyConversation = async (req, res) => {
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
};

// ==================== MESS CHAT ====================

/**
 * GET /mess/conversations
 * Get all mess-based conversations.
 */
exports.getMessConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.aggregate([
            {
                $match: {
                    mess: { $exists: true, $ne: null },
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            { $sort: { createdAt: -1 } },
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
            { $sort: { lastMessageTime: -1 } }
        ]);

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
};

/**
 * GET /mess/:messId/:userId
 * Get messages for a specific mess conversation.
 */
exports.getMessMessages = async (req, res) => {
    try {
        const { messId, userId } = req.params;
        const currentUserId = req.user._id;

        const mess = await Mess.findById(messId);
        if (!mess) {
            return res.status(404).json({ message: 'Mess not found' });
        }

        const isOwner = mess.owner.toString() === currentUserId.toString();
        if (!isOwner) {
            const subscription = await MessSubscription.findOne({
                user: currentUserId,
                mess: messId,
                status: 'Active'
            });
            if (!subscription) {
                return res.status(403).json({ message: 'Chat only available for approved subscriptions' });
            }
        }

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
};

/**
 * POST /mess/send
 * Send a mess-based message (subscription required).
 */
exports.sendMessMessage = async (req, res) => {
    try {
        const { receiverId, messId, content } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !messId || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const mess = await Mess.findById(messId);
        if (!mess) {
            return res.status(404).json({ message: 'Mess not found' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isOwner = mess.owner.toString() === senderId.toString();

        if (!isOwner) {
            const subscription = await MessSubscription.findOne({
                user: senderId,
                mess: messId,
                status: 'Active'
            });
            if (!subscription) {
                return res.status(403).json({ message: 'Chat only available for approved subscriptions' });
            }
        } else {
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
        await message.populate('sender', 'name role');
        await message.populate('receiver', 'name role');

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
};

/**
 * DELETE /mess/:messId/:userId
 * Delete mess conversation messages.
 */
exports.deleteMessConversation = async (req, res) => {
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
};
