
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Mess = require("../models/Mess");
const MessSubscription = require("../models/MessSubscription");
const User = require("../models/User");
const notificationService = require("../services/notificationService");
const {
  coerceMealsSelected,
  isVerificationFresh,
  isAadhaarFresh,
  meetsBookingVerification,
  syncRoomAvailability
} = require('../services/bookingService');

/* ===================== ADMIN: GET ALL BOOKINGS ===================== */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("student", "email name")
      .populate("property", "title location isAvailable rent")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ===================== STUDENT: CREATE BOOKING ===================== */
exports.createBooking = async (req, res) => {
  try {
    const { property_id } = req.params;
    let { mealsSelected, startDate, endDate } = req.body;
    mealsSelected = coerceMealsSelected(mealsSelected);

    // 1️⃣ Validate property ID
    if (!mongoose.Types.ObjectId.isValid(property_id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    // 2️⃣ Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    // 3️⃣ Property check
    const property = await Property.findById(property_id).populate('owner', 'name email');
    if (!property) {
      return res.status(400).json({ message: "Property not found" });
    }

    // If property-level availability is false and there are no rooms, block
    if (!property.isAvailable) {
      // if property has rooms, we'll allow booking to proceed and rely on room availability checks
      // but for backward compatibility, if no rooms exist, block
      const Room = require('../models/Room');
      const roomsCount = await Room.countDocuments({ property: property._id });
      if (roomsCount === 0) {
        return res.status(400).json({ message: "Property not available" });
      }
    }

    // 4️⃣ Booking gating: enforce minimum verification state if configured
    const verified = await meetsBookingVerification(req.user._id);
    if (!verified) {
      return res.status(403).json({ message: 'Booking requires additional verification. Please complete verification to proceed.' });
    }

    const existingBooking = await Booking.findOne({
      student: req.user._id,
      property: property_id,
      status: { $in: ["Pending", "Confirmed"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active booking for this property",
      });
    }

    // 5️⃣ Create booking (optionally for a specific room)
    const roomId = req.body.roomId;
    let roomsCount = parseInt(req.body.roomsCount) || 1;
    let membersCount = parseInt(req.body.membersCount) || 1;
    if (roomsCount < 1) roomsCount = 1;
    if (membersCount < 1) membersCount = 1;

    if (roomId) {
      const Room = require('../models/Room');
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ message: 'Invalid room ID' });
      }
      const room = await Room.findOne({ _id: roomId, property: property._id });
      if (!room) return res.status(400).json({ message: 'Room not found for this property' });
      // Validate membersCount against room capacity
      if (membersCount > roomsCount * (room.maxOccupancy || 1)) {
        return res.status(400).json({ message: 'Members exceed room capacity for requested rooms' });
      }
      // allow Pending bookings; availability enforced on confirm to avoid race on pending
      const booking = await Booking.create({
        student: req.user._id,
        property: property_id,
        room: room._id,
        roomsCount,
        membersCount,
        mealsSelected,
        startDate,
        endDate,
        status: 'Pending'
      });

      // notify owner as below
      var createdBooking = booking;
    } else {
      const booking = await Booking.create({
        student: req.user._id,
        property: property_id,
        mealsSelected,
        startDate,
        endDate,
        status: "Pending",
      });
      var createdBooking = booking;
    }

    // 6️⃣ Send notification to property owner
    try {
      const student = await User.findById(req.user._id);
      if (property.owner) {
        // send notification (non-blocking)
        notificationService.bookingRequested(
          createdBooking,
          property,
          student,
          property.owner
        ).catch(err => console.error('Notification error (bookingRequested):', err));

        // Emit socket event to owner room
        try {
          const io = req.app.get('io');
          if (io) {
            const ownerId = property.owner._id ? property.owner._id.toString() : property.owner.toString();
            io.to(`user_${ownerId}`).emit('booking:requested', { booking: createdBooking, property, student });
          }
        } catch (e) {
          console.error('Socket emit error (bookingRequested):', e);
        }
      }
    } catch (notifError) {
      console.error("Notification error:", notifError);
      // Don't fail the booking if notification fails
    }

    // 7️⃣ If request included a messId (subscribe to a mess along with booking), create a MessSubscription
    try {
      const messId = req.body.messId || req.body.mess || null;
      const messPlan = req.body.messPlan || req.body.plan || null;
      if (messId) {
        const mess = await Mess.findById(messId);
        if (!mess) {
          // do not fail the booking; just warn
          console.warn('[Booking] requested mess not found:', messId);
        } else {
          // Prevent duplicate active subscription
          const existingSubscription = await MessSubscription.findOne({ user: req.user._id, mess: messId, status: 'Active' });
          if (!existingSubscription) {
            // Atomically reserve a mess slot before creating subscription
            const maxSubs = mess.maxSubscribers || 100;
            const reserved = await Mess.findOneAndUpdate(
              { _id: mess._id, currentSubscribers: { $lt: maxSubs } },
              { $inc: { currentSubscribers: 1, subscribersCount: 1 } },
              { new: true }
            );
            if (!reserved) {
              console.warn('[Booking] mess service full for messId:', messId);
            } else {
              // calculate amount similar to messRoutes
              let amount = 0;
              const pricing = mess.pricing || {};
              switch (messPlan) {
                case 'monthly-all': amount = pricing.monthly?.allMeals || 0; break;
                case 'monthly-two': amount = pricing.monthly?.twoMeals || 0; break;
                case 'monthly-one': amount = pricing.monthly?.oneMeal || 0; break;
                case 'monthly-breakfast': amount = pricing.monthly?.breakfast || 0; break;
                case 'monthly-lunch': amount = pricing.monthly?.lunch || 0; break;
                case 'monthly-dinner': amount = pricing.monthly?.dinner || 0; break;
                default: amount = pricing.monthly?.allMeals || 0; break;
              }

              const start = new Date(req.body.messStartDate || Date.now());
              const end = new Date(start);
              end.setMonth(end.getMonth() + 1);

              const subscription = new MessSubscription({
                user: req.user._id,
                mess: messId,
                plan: messPlan || 'monthly-all',
                selectedMeals: req.body.selectedMeals || [],
                startDate: start,
                endDate: end,
                amount,
                deliveryPreference: req.body.deliveryPreference || 'Pickup',
                deliveryAddress: req.body.deliveryAddress || '',
                specialInstructions: req.body.specialInstructions || '',
                status: 'Pending',
                paymentStatus: 'Pending'
              });

              try {
                await subscription.save();
                // Emit socket event for subscription creation (booking flow)
                try {
                  const io = req.app.get('io');
                  if (io) {
                    const ownerId = mess && mess.owner ? (mess.owner._id ? mess.owner._id.toString() : mess.owner.toString()) : null;
                    const userId = req.user._id.toString();
                    if (ownerId) io.to(`user_${ownerId}`).emit('mess:subscription:created', { subscription, messId: mess._id, userId });
                    io.to(`user_${userId}`).emit('mess:subscription:created', { subscription, messId: mess._id, ownerId });
                  }
                } catch (emitErr) {
                  console.error('Socket emit error (messSubscriptionCreated - booking):', emitErr);
                }
                // attach subscription to booking (best-effort)
                try {
                  createdBooking.messSubscription = subscription._id;
                  await createdBooking.save();
                } catch (attachErr) {
                  console.error('[Booking] failed to attach mess subscription to booking:', attachErr);
                }
              } catch (saveErr) {
                // rollback reserved counters
                try {
                  await Mess.findByIdAndUpdate(messId, { $inc: { currentSubscribers: -1, subscribersCount: -1 } });
                } catch (rbErr) {
                  console.error('Failed to rollback mess counters after booking subscription save failure:', rbErr);
                }
                console.error('[Booking] failed to save mess subscription:', saveErr);
              }
            }
          } else {
            console.warn('[Booking] user already has active subscription for mess:', messId);
          }
        }
      }
    } catch (messAttachErr) {
      console.error('Error creating mess subscription during booking:', messAttachErr);
      // Do not fail booking on mess subscription errors
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: createdBooking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ===================== ADMIN: APPROVE / REJECT ===================== */
exports.adminUpdateBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    if (!["Confirmed", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find booking to handle room availability transitions safely
    const booking = await Booking.findById(booking_id)
      .populate('student', 'email name')
      .populate({ path: 'property', select: 'title location owner' });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const prevStatus = booking.status;
    booking.status = status;

    // Handle room availability transitions
    const roomResult = await syncRoomAvailability(booking, prevStatus, status);
    if (!roomResult.ok) {
      return res.status(400).json({ message: roomResult.error });
    }

    await booking.save();

    // Send notification to student
    try {
      if (status === 'Confirmed') {
        await notificationService.bookingApproved(
          booking,
          booking.property,
          booking.student,
          booking.property.owner
        );
      } else if (status === 'Rejected') {
        await notificationService.bookingRejected(
          booking,
          booking.property,
          booking.student,
          booking.property.owner
        );
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({ message: `Booking ${status}`, booking });
  } catch (error) {
    console.error("Admin booking update error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ===================== ADMIN: CREATE BOOKING ON BEHALF (OVERRIDE GATING) ===================== */
exports.adminCreateBooking = async (req, res) => {
  try {
    const { studentId, propertyId, roomId, mealsSelected, startDate, endDate, roomsCount = 1, membersCount = 1 } = req.body;

    if (!studentId || !propertyId) return res.status(400).json({ message: 'studentId and propertyId are required' });
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: 'Invalid studentId or propertyId' });
    }

    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) return res.status(400).json({ message: 'Property not found' });

    // Create booking bypassing verification gating
    let createdBooking;

    if (roomId) {
      const Room = require('../models/Room');
      if (!mongoose.Types.ObjectId.isValid(roomId)) return res.status(400).json({ message: 'Invalid room ID' });
      const room = await Room.findOne({ _id: roomId, property: property._id });
      if (!room) return res.status(400).json({ message: 'Room not found for this property' });

      const booking = await Booking.create({
        student: studentId,
        property: propertyId,
        room: room._id,
        roomsCount,
        membersCount,
        mealsSelected,
        startDate,
        endDate,
        status: 'Pending'
      });
      createdBooking = booking;
    } else {
      const booking = await Booking.create({
        student: studentId,
        property: propertyId,
        mealsSelected,
        startDate,
        endDate,
        status: 'Pending'
      });
      createdBooking = booking;
    }

    // Notify owner
    try {
      const student = await User.findById(studentId);
      if (property.owner) {
        notificationService.bookingRequested(
          createdBooking,
          property,
          student,
          property.owner
        ).catch(err => console.error('Notification error (bookingRequested - admin create):', err));
      }
    } catch (notifErr) {
      console.error('Failed to notify owner for admin-created booking', notifErr);
    }

    res.status(201).json({ message: 'Booking created by admin', booking: createdBooking });
  } catch (error) {
    console.error('Admin create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ===================== OWNER: GET BOOKINGS FOR THEIR PROPERTIES ===================== */
exports.ownerGetBookings = async (req, res) => {
  try {
    // Get property IDs owned by this owner
    const properties = await Property.find({ owner: req.user._id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    console.log('[OwnerBookings] owner:', req.user._id.toString(), 'propertyIds:', propertyIds);

    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('student', 'email name')
      .populate({ path: 'property', select: 'title location isAvailable owner', populate: { path: 'owner', select: 'name email' } })
      .sort({ createdAt: -1 });

    console.log('[OwnerBookings] found', bookings.length, 'bookings for owner', req.user._id.toString());

    res.json(bookings);
  } catch (error) {
    console.error('Owner fetch bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


/* ===================== OWNER: APPROVE / REJECT FOR THEIR PROPERTY BOOKINGS ===================== */
exports.ownerUpdateBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status } = req.body;

    console.log('[OwnerBookingUpdate] incoming owner:', req.user._id?.toString(), 'bookingId:', booking_id, 'body:', req.body);

    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    if (!["Confirmed", "Rejected"].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find booking and ensure owner owns the property
    const booking = await Booking.findById(booking_id)
      .populate('student', 'email name')
      .populate({ path: 'property', select: 'title location owner', populate: { path: 'owner', select: 'name email' } });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.property) {
      console.log('[OwnerBookingUpdate] no property attached to booking', booking._id.toString());
      return res.status(403).json({ message: 'You are not authorized to manage this booking' });
    }

    // Normalize owner id whether populated or not
    const bookingOwnerId = booking.property.owner && booking.property.owner._id ? booking.property.owner._id.toString() : booking.property.owner ? booking.property.owner.toString() : null;
    const requesterId = req.user._id.toString();
    if (!bookingOwnerId || bookingOwnerId !== requesterId) {
      console.log('[OwnerBookingUpdate] owner mismatch: bookingOwnerId=', bookingOwnerId, 'requesterId=', requesterId);
      return res.status(403).json({ message: 'You are not authorized to manage this booking' });
    }

    // Handle status transitions with room availability
    const prevStatus = booking.status;
    booking.status = status;

    // Handle room availability transitions
    const roomResult = await syncRoomAvailability(booking, prevStatus, status);
    if (!roomResult.ok) {
      return res.status(400).json({ message: roomResult.error });
    }

    await booking.save();

    console.log('[OwnerBookingUpdate] updated booking:', booking._id.toString(), 'newStatus:', booking.status);

    // Emit socket event to relevant users (student + owner)
    try {
      const io = req.app.get('io');
      if (io) {
        const ownerId = booking.property.owner && booking.property.owner._id ? booking.property.owner._id.toString() : booking.property.owner ? booking.property.owner.toString() : null;
        const studentId = booking.student && booking.student._id ? booking.student._id.toString() : booking.student ? booking.student.toString() : null;
        if (ownerId) io.to(`user_${ownerId}`).emit('booking:updated', { booking });
        if (studentId) io.to(`user_${studentId}`).emit('booking:updated', { booking });
      }
    } catch (e) {
      console.error('Socket emit error (bookingUpdated):', e);
    }

    // Send notification to student (fire-and-forget to avoid blocking request)
    if (status === 'Confirmed') {
      notificationService.bookingApproved(
        booking,
        booking.property,
        booking.student,
        booking.property.owner
      ).catch(err => console.error('Notification error (bookingApproved):', err));
    } else if (status === 'Rejected') {
      notificationService.bookingRejected(
        booking,
        booking.property,
        booking.student,
        booking.property.owner
      ).catch(err => console.error('Notification error (bookingRejected):', err));
    }

    res.json({ message: `Booking ${status}`, booking });
  } catch (error) {
    console.error('Owner booking update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


/* ===================== STUDENT: MY BOOKINGS ===================== */
exports.studentGetBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate("property", "title location")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Student bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ===================== STUDENT: LEAVE ROOM / END STAY ===================== */
exports.studentLeaveRoom = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // Find the booking and verify ownership
    const booking = await Booking.findOne({
      _id: booking_id,
      student: req.user._id,
      status: "Confirmed"
    }).populate({
      path: "property",
      select: "title location owner",
      populate: { path: "owner", select: "name email" }
    });

    if (!booking) {
      return res.status(404).json({
        message: "Active booking not found or you don't have permission"
      });
    }

    // Update booking status to Completed
    booking.status = "Completed";
    booking.completedAt = new Date();
    booking.completionReason = reason || "Student left the room";
    booking.mealsSelected = coerceMealsSelected(booking.mealsSelected);
    await booking.save();

    // Mark property as available again
    await syncRoomAvailability(booking, 'Confirmed', 'Completed');

    // Send notification to owner
    try {
      const student = await User.findById(req.user._id);
      if (booking.property.owner) {
        await notificationService.bookingCompleted(
          booking,
          booking.property,
          student,
          booking.property.owner,
          reason
        );
      }
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    res.json({
      message: "You have successfully left the room. The property is now available for others.",
      booking
    });
  } catch (error) {
    console.error("Leave room error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ===================== STUDENT: CANCEL PENDING BOOKING ===================== */
exports.studentCancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // Find the booking and verify ownership (only pending bookings can be cancelled)
    const booking = await Booking.findOne({
      _id: booking_id,
      student: req.user._id,
      status: "Pending"
    }).populate({
      path: "property",
      select: "title location owner",
      populate: { path: "owner", select: "name email" }
    });

    if (!booking) {
      return res.status(404).json({
        message: "Pending booking not found or you don't have permission"
      });
    }

    // Update booking status to Cancelled
    booking.status = "Cancelled";
    await booking.save();

    // Send notification to owner
    try {
      const student = await User.findById(req.user._id);
      if (booking.property.owner) {
        await notificationService.bookingCancelled(
          booking,
          booking.property,
          student,
          booking.property.owner
        );
      }
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
}



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
              io.to(`user_${ownerId}`).emit('booking:requested', { booking, property, student });
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
          io.to(`user_${roommateId}`).emit('booking:roommate:invited', {
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
        return res.status(400).json({ message: `Already ${coOccupant.status}` });
      }

      if (action === 'confirm') {
        coOccupant.status = 'confirmed';
        coOccupant.confirmedAt = new Date();
        await booking.save();

        try {
          const io = req.app.get('io');
          if (io) {
            const studentId = booking.student._id.toString();
            io.to(`user_${studentId}`).emit('booking:roommate:confirmed', {
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
            io.to(`user_${studentId}`).emit('booking:roommate:declined', {
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
      return res.status(400).json({ message: `This request has already been ${joinRequest.status}` });
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
      message: `Join request ${action}ed successfully`,
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

