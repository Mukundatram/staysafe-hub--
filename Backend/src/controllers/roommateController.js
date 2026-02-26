const RoommateProfile = require('../models/RoommateProfile');
const RoommateRequest = require('../models/RoommateRequest');
const User = require('../models/User');
const { calculateMatch } = require('../utils/roommateMatching');

// ===== PROFILE MANAGEMENT =====

/**
 * POST /profile — Create or update roommate profile
 */
exports.createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;

        const required = ['city', 'budgetMin', 'budgetMax', 'expectedMoveInDate', 'duration', 'studentStatus'];
        const missing = required.filter(field => !profileData[field]);
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        if (!profileData.lifestyle || !profileData.lifestyle.sleepSchedule || !profileData.lifestyle.foodPreference ||
            !profileData.lifestyle.smoking || !profileData.lifestyle.guests || !profileData.lifestyle.cleanlinessLevel) {
            return res.status(400).json({ error: 'All lifestyle fields are required' });
        }

        let profile = await RoommateProfile.findOne({ user: userId });

        if (profile) {
            Object.assign(profile, profileData);
            await profile.save();
        } else {
            profile = await RoommateProfile.create({ user: userId, ...profileData });
        }

        await profile.populate('user', 'name email profilePicture isVerified');

        res.status(200).json({
            message: profile.isNew ? 'Profile created successfully' : 'Profile updated successfully',
            profile
        });
    } catch (error) {
        console.error('Profile creation error:', error);
        res.status(500).json({ error: error.message || 'Failed to save profile' });
    }
};

/**
 * GET /my-profile
 */
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await RoommateProfile.findOne({ user: req.user.id })
            .populate('user', 'name email profilePicture isVerified phone');

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ profile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * GET /profile/:userId — Public view
 */
exports.getProfileByUserId = async (req, res) => {
    try {
        const profile = await RoommateProfile.findOne({
            user: req.params.userId,
            isProfileActive: true
        }).populate('user', 'name email profilePicture isVerified college');

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found or inactive' });
        }

        if (profile.isUserBlocked(req.user.id)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        profile.viewCount += 1;
        await profile.save();

        res.json({ profile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * PATCH /profile/active — Toggle active status
 */
exports.toggleProfileActive = async (req, res) => {
    try {
        const { isActive } = req.body;

        const profile = await RoommateProfile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        profile.isProfileActive = isActive !== undefined ? isActive : !profile.isProfileActive;
        await profile.save();

        res.json({
            message: `Profile ${profile.isProfileActive ? 'activated' : 'deactivated'}`,
            isActive: profile.isProfileActive
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile status' });
    }
};

/**
 * DELETE /profile
 */
exports.deleteProfile = async (req, res) => {
    try {
        await RoommateProfile.findOneAndDelete({ user: req.user.id });
        await RoommateRequest.deleteMany({
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ]
        });

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete profile' });
    }
};

// ===== MATCHING & DISCOVERY =====

/**
 * GET /matches
 */
exports.getMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, minScore = 50 } = req.query;

        const userProfile = await RoommateProfile.findOne({ user: userId });
        if (!userProfile) {
            return res.status(404).json({ error: 'Please create your profile first' });
        }

        if (!userProfile.isProfileActive) {
            return res.status(400).json({ error: 'Please activate your profile to see matches' });
        }

        const potentialMatches = await RoommateProfile.find({
            city: userProfile.city,
            isProfileActive: true,
            user: {
                $ne: userId,
                $nin: userProfile.blockedUsers
            }
        }).populate('user', 'name email gender profilePicture isVerified verificationStatus aadhaarVerification college phone');

        const scoredMatches = potentialMatches
            .map(targetProfile => {
                const matchResult = calculateMatch(userProfile, targetProfile);
                if (!matchResult.matches) return null;

                return {
                    user: targetProfile.user,
                    profile: {
                        city: targetProfile.city,
                        area: targetProfile.area,
                        budgetMin: targetProfile.budgetMin,
                        budgetMax: targetProfile.budgetMax,
                        expectedMoveInDate: targetProfile.expectedMoveInDate,
                        duration: targetProfile.duration,
                        studentStatus: targetProfile.studentStatus,
                        college: targetProfile.college,
                        year: targetProfile.year,
                        interests: targetProfile.interests,
                        lifestyle: targetProfile.lifestyle
                    },
                    matchPercentage: matchResult.score,
                    explanation: matchResult.explanation,
                    commonInterests: matchResult.commonInterests,
                    breakdown: matchResult.breakdown
                };
            })
            .filter(match => match && match.matchPercentage >= parseInt(minScore))
            .sort((a, b) => b.matchPercentage - a.matchPercentage);

        for (let match of scoredMatches) {
            const existingRequest = await RoommateRequest.findOne({
                $or: [
                    { sender: userId, receiver: match.user._id },
                    { sender: match.user._id, receiver: userId }
                ]
            });

            match.connectionStatus = existingRequest ? existingRequest.status : 'none';
            match.canConnect = !existingRequest || existingRequest.status === 'rejected';
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMatches = scoredMatches.slice(startIndex, endIndex);

        res.json({
            matches: paginatedMatches,
            pagination: {
                total: scoredMatches.length,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(scoredMatches.length / limit)
            }
        });
    } catch (error) {
        console.error('Matching error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
};

// ===== CONNECTION REQUESTS =====

/**
 * POST /request — Send connection request
 */
exports.sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, message } = req.body;

        if (!receiverId) {
            return res.status(400).json({ error: 'Receiver ID is required' });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }

        const sender = await User.findById(senderId);
        if (!sender.verificationStatus?.isFullyVerified && !sender.aadhaarVerification?.verified) {
            return res.status(403).json({ error: 'Please verify your account to send connection requests' });
        }

        const receiverProfile = await RoommateProfile.findOne({ user: receiverId });
        if (!receiverProfile || !receiverProfile.isProfileActive) {
            return res.status(404).json({ error: 'User profile not found or inactive' });
        }

        if (receiverProfile.isUserBlocked(senderId)) {
            return res.status(403).json({ error: 'Cannot send request to this user' });
        }

        const cooldownCheck = await RoommateRequest.checkCooldown(senderId, receiverId);
        if (cooldownCheck.onCooldown) {
            return res.status(429).json({
                error: 'Please wait before sending another request',
                canRequestAt: cooldownCheck.canRequestAt
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestCount = await RoommateRequest.countDocuments({
            sender: senderId,
            createdAt: { $gte: today }
        });

        if (requestCount >= 10) {
            return res.status(429).json({ error: 'Daily request limit reached (10 requests per day)' });
        }

        const existing = await RoommateRequest.findOne({
            sender: senderId,
            receiver: receiverId
        });

        if (existing) {
            if (existing.status === 'pending') {
                return res.status(400).json({ error: 'Request already sent' });
            } else if (existing.status === 'accepted') {
                return res.status(400).json({ error: 'Already connected' });
            } else if (existing.status === 'blocked') {
                return res.status(403).json({ error: 'Cannot send request' });
            } else if (existing.status === 'rejected') {
                await existing.deleteOne();
            }
        }

        const request = await RoommateRequest.create({
            sender: senderId,
            receiver: receiverId,
            message: message || ''
        });

        await request.populate('receiver', 'name email profilePicture isVerified');

        res.status(201).json({
            message: 'Connection request sent successfully',
            request
        });
    } catch (error) {
        console.error('Request creation error:', error);
        res.status(500).json({ error: error.message || 'Failed to send request' });
    }
};

/**
 * GET /requests/received
 */
exports.getReceivedRequests = async (req, res) => {
    try {
        const requests = await RoommateRequest.getPendingForUser(req.user.id);

        for (let request of requests) {
            const profile = await RoommateProfile.findOne({ user: request.sender._id });
            request._doc.senderProfile = profile;
        }

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

/**
 * GET /requests/sent
 */
exports.getSentRequests = async (req, res) => {
    try {
        const requests = await RoommateRequest.getSentByUser(req.user.id);
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

/**
 * PATCH /request/:id/accept
 */
exports.acceptRequest = async (req, res) => {
    try {
        const request = await RoommateRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.receiver.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already responded to' });
        }

        await request.accept();
        await request.populate('sender receiver', 'name email profilePicture phone');

        res.json({ message: 'Connection request accepted', request });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept request' });
    }
};

/**
 * PATCH /request/:id/reject
 */
exports.rejectRequest = async (req, res) => {
    try {
        const request = await RoommateRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.receiver.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already responded to' });
        }

        await request.reject();

        res.json({
            message: 'Connection request rejected',
            canRequestAgainAt: request.canRequestAgainAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
};

/**
 * POST /block/:userId
 */
exports.blockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const blockedUserId = req.params.userId;

        if (userId === blockedUserId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        const profile = await RoommateProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        if (!profile.isUserBlocked(blockedUserId)) {
            profile.blockedUsers.push(blockedUserId);
            await profile.save();
        }

        await RoommateRequest.updateMany(
            {
                $or: [
                    { sender: userId, receiver: blockedUserId },
                    { sender: blockedUserId, receiver: userId }
                ]
            },
            { status: 'blocked' }
        );

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to block user' });
    }
};

/**
 * GET /connections
 */
exports.getConnections = async (req, res) => {
    try {
        const connections = await RoommateRequest.getConnections(req.user.id);

        const enrichedConnections = await Promise.all(
            connections.map(async (conn) => {
                const otherUserId = conn.sender._id.toString() === req.user.id
                    ? conn.receiver._id
                    : conn.sender._id;

                const profile = await RoommateProfile.findOne({ user: otherUserId });

                return {
                    ...conn._doc,
                    otherUserProfile: profile
                };
            })
        );

        res.json({ connections: enrichedConnections });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
};

// ===== PROPERTY SHARING =====

/**
 * POST /share-property
 */
exports.shareProperty = async (req, res) => {
    try {
        const { roommateId, propertyId, message } = req.body;
        const userId = req.user.id;

        if (!roommateId || !propertyId) {
            return res.status(400).json({ error: 'Roommate ID and Property ID are required' });
        }

        const areConnected = await RoommateRequest.areConnected(userId, roommateId);
        if (!areConnected) {
            return res.status(403).json({ error: 'You must be connected with this user to share properties' });
        }

        const Property = require('../models/Property');
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const Message = require('../models/Message');
        const chatMessage = await Message.create({
            sender: userId,
            receiver: roommateId,
            content: message || `Check out this property: ${property.title} - ₹${property.rent}/month at ${property.location}`
        });

        await chatMessage.populate('sender receiver', 'name profilePicture');

        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${roommateId}`).emit('property:shared', {
                    message: chatMessage,
                    property,
                    sharedBy: req.user
                });
            }
        } catch (emitErr) {
            console.error('Socket emit error (property shared):', emitErr);
        }

        res.json({
            message: 'Property shared successfully',
            chatMessage,
            property
        });
    } catch (error) {
        console.error('Share property error:', error);
        res.status(500).json({ error: 'Failed to share property' });
    }
};

/**
 * GET /shared-properties/:roommateId
 */
exports.getSharedProperties = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roommateId } = req.params;

        const areConnected = await RoommateRequest.areConnected(userId, roommateId);
        if (!areConnected) {
            return res.status(403).json({ error: 'You must be connected with this user' });
        }

        const Wishlist = require('../models/Wishlist');
        const yourWishlist = await Wishlist.find({ user: userId }).populate('property');
        const roommateWishlist = await Wishlist.find({ user: roommateId }).populate('property');

        const commonProperties = yourWishlist.filter(item1 =>
            roommateWishlist.some(item2 =>
                item2.property && item1.property &&
                item2.property._id.toString() === item1.property._id.toString()
            )
        ).map(item => item.property);

        res.json({
            yourWishlist: yourWishlist.map(w => w.property),
            roommateWishlist: roommateWishlist.map(w => w.property),
            commonProperties
        });
    } catch (error) {
        console.error('Get shared properties error:', error);
        res.status(500).json({ error: 'Failed to fetch shared properties' });
    }
};
