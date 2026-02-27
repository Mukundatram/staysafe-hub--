const fs = require('fs');
const path = require('path');

const controllerFile = path.join(__dirname, 'src', 'controllers', 'bookingController.js');

const missingFunctions = `
/* ===================== ROOMMATE JOINT BOOKING ROUTES ===================== */

/**
 * Create booking and invite roommate to join
 */
exports.bookWithRoommate = async (req, res) => {
    try {
      const { property_id } = req.params;
      let { roommateId, roomId, startDate, endDate, mealsSelected, roomsCount = 1, membersCount = 2 } = req.body;

      if (Array.isArray(mealsSelected)) {
        if (mealsSelected.length === 1 && (mealsSelected[0] === 'false' || mealsSelected[0] === false)) {
          mealsSelected = false;
        } else if (mealsSelected.length === 1 && (mealsSelected[0] === 'true' || mealsSelected[0] === true)) {
          mealsSelected = true;
        } else {
          mealsSelected = mealsSelected.length > 0;
        }
      } else if (typeof mealsSelected === 'string') {
        mealsSelected = /^(true|1|yes)$/i.test(mealsSelected.trim());
      } else {
        mealsSelected = Boolean(mealsSelected);
      }

      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(property_id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      if (!roommateId || !mongoose.Types.ObjectId.isValid(roommateId)) {
        return res.status(400).json({ message: "Valid roommate ID is required" });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      console.log('DEBUG: Checking connection between:', req.user._id, 'and', roommateId);
      const RoommateRequest = require('../models/RoommateRequest');
      const connection = await RoommateRequest.findOne({
        $or: [
          { sender: req.user._id, receiver: roommateId, status: 'accepted' },
          { sender: roommateId, receiver: req.user._id, status: 'accepted' }
        ]
      });
      console.log('DEBUG: Connection found:', connection);

      if (!connection) {
        return res.status(403).json({ message: 'You must be connected with this roommate to book together' });
      }

      const Property = require('../models/Property');
      const property = await Property.findById(property_id).populate('owner', 'name email');
      if (!property) {
        return res.status(400).json({ message: "Property not found" });
      }

      const User = require('../models/User');
      const minVerification = process.env.BOOKING_MIN_VERIFICATION || '';
      if (minVerification) {
        const requestingUser = await User.findById(req.user._id).select('verificationState aadhaarVerification verificationStatus role');
        const aadhaarVerified = requestingUser?.aadhaarVerification?.verified;
        const identityVerified = requestingUser?.verificationStatus?.identity?.verified;
        const isFully = requestingUser?.verificationStatus?.isFullyVerified;
        const stateMatches = requestingUser?.verificationState === minVerification;
        if (!(aadhaarVerified || identityVerified || isFully || stateMatches)) {
          return res.status(403).json({ message: 'Booking requires additional verification.' });
        }
      }

      const Booking = require('../models/Booking');
      const existingBooking = await Booking.findOne({
        student: req.user._id,
        property: property_id,
        status: { $in: ["Pending", "Confirmed"] },
      });

      if (existingBooking) {
        return res.status(400).json({ message: "You already have an active booking for this property" });
      }

      let booking;

      if (roomId) {
        const Room = require('../models/Room');
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          return res.status(400).json({ message: 'Invalid room ID' });
        }
        const room = await Room.findOne({ _id: roomId, property: property._id });
        if (!room) {
          return res.status(400).json({ message: 'Room not found for this property' });
        }

        if (membersCount > roomsCount * (room.maxOccupancy || 1)) {
          return res.status(400).json({ message: 'Members exceed room capacity' });
        }

        booking = await Booking.create({
          student: req.user._id,
          property: property_id,
          room: room._id,
          roomsCount,
          membersCount,
          mealsSelected,
          startDate,
          endDate,
          status: 'Pending',
          roommateConnection: connection._id,
          coOccupants: [{
            user: roommateId,
            status: 'pending'
          }]
        });
      } else {
        booking = await Booking.create({
          student: req.user._id,
          property: property_id,
          mealsSelected,
          startDate,
          endDate,
          status: 'Pending',
          membersCount,
          roommateConnection: connection._id,
          coOccupants: [{
            user: roommateId,
            status: 'pending'
          }]
        });
      }

      try {
        const student = await User.findById(req.user._id);
        if (property.owner) {
          const notificationService = require('../services/notificationService');
          notificationService.bookingRequested(
            booking,
            property,
            student,
            property.owner
          ).catch(err => console.error('Notification error (bookingRequested):', err));

          try {
            const io = req.app.get('io');
            if (io) {
              const ownerId = property.owner._id ? property.owner._id.toString() : property.owner.toString();
              io.to(\`user_\${ownerId}\`).emit('booking:requested', { booking, property, student });
            }
          } catch (e) {
            console.error('Socket emit error:', e);
          }
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      try {
        const io = req.app.get('io');
        if (io) {
          io.to(\`user_\${roommateId}\`).emit('booking:roommate:invited', {
            booking,
            property,
            invitedBy: req.user
          });
        }
      } catch (e) {
        console.error('Socket emit error (roommate invite):', e);
      }

      res.status(201).json({
        message: "Joint booking created. Waiting for roommate confirmation.",
        booking
      });
    } catch (error) {
      console.error("Joint booking creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
};

/**
 * Roommate confirms or declines joining the booking
 */
exports.confirmRoommate = async (req, res) => {
    try {
      const { booking_id } = req.params;
      const { action } = req.body; 

      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(booking_id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      if (!['confirm', 'decline'].includes(action)) {
        return res.status(400).json({ message: "Action must be 'confirm' or 'decline'" });
      }

      const Booking = require('../models/Booking');
      const booking = await Booking.findById(booking_id)
        .populate('student', 'name email')
        .populate('property', 'title location');

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const coOccupant = booking.coOccupants.find(
        co => co.user.toString() === req.user._id.toString()
      );

      if (!coOccupant) {
        return res.status(403).json({ message: "You are not invited to this booking" });
      }

      if (coOccupant.status !== 'pending') {
        return res.status(400).json({ message: \`Already \${coOccupant.status}\` });
      }

      if (action === 'confirm') {
        coOccupant.status = 'confirmed';
        coOccupant.confirmedAt = new Date();
        await booking.save();

        try {
          const io = req.app.get('io');
          if (io) {
            const studentId = booking.student._id.toString();
            io.to(\`user_\${studentId}\`).emit('booking:roommate:confirmed', {
              booking,
              confirmedBy: req.user
            });
          }
        } catch (e) {
          console.error('Socket emit error:', e);
        }

        res.json({
          message: "You have confirmed the joint booking",
          booking
        });
      } else {
        coOccupant.status = 'declined';
        await booking.save();

        try {
          const io = req.app.get('io');
          if (io) {
            const studentId = booking.student._id.toString();
            io.to(\`user_\${studentId}\`).emit('booking:roommate:declined', {
              booking,
              declinedBy: req.user
            });
          }
        } catch (e) {
          console.error('Socket emit error:', e);
        }

        res.json({
          message: "You have declined the joint booking"
        });
      }
    } catch (error) {
      console.error("Roommate booking confirmation error:", error);
      res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get all pending booking invitations for current user
 */
exports.getPendingRoommateInvites = async (req, res) => {
    try {
      const Booking = require('../models/Booking');
      const userId = req.user._id;

      const bookings = await Booking.find({
        'coOccupants.user': userId,
        'coOccupants.status': 'pending'
      })
        .populate('student', 'name email profilePicture')
        .populate('property', 'title location images rent')
        .populate('room', 'roomType price maxOccupancy')
        .sort({ createdAt: -1 });

      const pendingInvites = bookings.filter(booking => {
        const userOccupant = booking.coOccupants.find(
          co => co.user.toString() === userId.toString()
        );
        return userOccupant && userOccupant.status === 'pending';
      });

      res.json({ invites: pendingInvites });
    } catch (error) {
      console.error("Fetch pending invites error:", error);
      res.status(500).json({ message: "Server error" });
    }
};

// ==================== ROOM SHARE DISCOVERY ROUTES ====================

exports.getRoomShares = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const currentUserId = req.user._id;

    const bookings = await Booking.find({
      status: 'Confirmed',
      openToRoommate: true,
      student: { $ne: currentUserId }
    })
      .populate('student', 'name email profilePicture')
      .populate('property', 'title location rent images rooms')
      .populate({
        path: 'room',
        select: 'type capacity maxOccupancy pricePerBed'
      })
      .sort({ createdAt: -1 });

    const availableShares = [];

    for (const booking of bookings) {
      const room = booking.room || booking.property?.rooms?.find(r => r._id?.toString() === booking.room?.toString());
      const maxOccupancy = room?.maxOccupancy || room?.capacity || 2;

      const confirmedCoOccupants = (booking.coOccupants || []).filter(co => co.status === 'confirmed').length;
      const currentOccupants = 1 + confirmedCoOccupants;
      const availableSpots = maxOccupancy - currentOccupants;

      if (availableSpots > 0) {
        const hasPendingRequest = booking.joinRequests?.some(
          req => req.requester.toString() === currentUserId.toString() && req.status === 'pending'
        );

        availableShares.push({
          _id: booking._id,
          property: booking.property,
          student: booking.student,
          startDate: booking.startDate,
          endDate: booking.endDate,
          membersCount: booking.membersCount,
          availableSpots,
          maxOccupancy,
          costPerPerson: Math.round(booking.property.rent / maxOccupancy),
          hasPendingRequest
        });
      }
    }

    res.json({ shares: availableShares });
  } catch (error) {
    console.error('Get room shares error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestJoin = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { message } = req.body;
    const requesterId = req.user._id;
    const Booking = require('../models/Booking');

    const booking = await Booking.findById(booking_id)
      .populate('student', 'name email')
      .populate('property', 'title location');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.openToRoommate || booking.status !== 'Confirmed') {
      return res.status(400).json({ message: 'This booking is not available for sharing' });
    }

    if (booking.student._id.toString() === requesterId.toString()) {
      return res.status(400).json({ message: 'You cannot join your own booking' });
    }

    const existingRequest = booking.joinRequests?.find(
      req => req.requester.toString() === requesterId.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'You have already sent a join request for this booking' });
    }

    const isCoOccupant = booking.coOccupants?.some(
      co => co.user.toString() === requesterId.toString()
    );

    if (isCoOccupant) {
      return res.status(400).json({ message: 'You are already part of this booking' });
    }

    if (!booking.joinRequests) {
      booking.joinRequests = [];
    }

    booking.joinRequests.push({
      requester: requesterId,
      message: message || '',
      status: 'pending',
      requestedAt: new Date()
    });

    await booking.save();

    res.status(201).json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.respondJoin = async (req, res) => {
  try {
    const { booking_id, request_id } = req.params;
    const { action } = req.body;
    const ownerId = req.user._id;
    const Booking = require('../models/Booking');

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "accept" or "decline"' });
    }

    const booking = await Booking.findById(booking_id)
      .populate('property', 'title location rent rooms');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized. Only the booking owner can respond to join requests' });
    }

    const joinRequest = booking.joinRequests?.id(request_id);

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: \`This request has already been \${joinRequest.status}\` });
    }

    if (action === 'accept') {
      if (!booking.coOccupants) {
        booking.coOccupants = [];
      }

      booking.coOccupants.push({
        user: joinRequest.requester,
        status: 'confirmed',
        confirmedAt: new Date()
      });

      booking.membersCount += 1;
      joinRequest.status = 'accepted';
      joinRequest.respondedAt = new Date();

      const room = booking.property.rooms?.find(r => r._id?.toString() === booking.room?.toString());
      const maxOccupancy = room?.maxOccupancy || room?.capacity || 2;

      if (booking.membersCount >= maxOccupancy) {
        booking.openToRoommate = false;
      }
    } else {
      joinRequest.status = 'declined';
      joinRequest.respondedAt = new Date();
    }

    await booking.save();

    res.json({
      message: \`Join request \${action}ed successfully\`,
      booking
    });
  } catch (error) {
    console.error('Respond join error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingJoinRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const Booking = require('../models/Booking');

    const bookings = await Booking.find({
      student: userId,
      'joinRequests.status': 'pending'
    })
      .populate('property', 'title location rent images')
      .populate('joinRequests.requester', 'name email profilePicture');

    const allRequests = [];

    bookings.forEach(booking => {
      (booking.joinRequests || [])
        .filter(req => req.status === 'pending')
        .forEach(req => {
          allRequests.push({
            _id: req._id,
            bookingId: booking._id,
            property: booking.property,
            requester: req.requester,
            message: req.message,
            requestedAt: req.requestedAt,
            startDate: booking.startDate,
            endDate: booking.endDate
          });
        });
    });

    res.json({ requests: allRequests });
  } catch (error) {
    console.error('Get pending join requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
\n`;

let controllerCode = fs.readFileSync(controllerFile, 'utf8');
if (!controllerCode.includes('exports.bookWithRoommate')) {
  fs.appendFileSync(controllerFile, missingFunctions);
  console.log('Appended recovered roommate functions!');
} else {
  console.log('Already appended!');
}
