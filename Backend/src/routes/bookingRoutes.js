const express = require("express");
const mongoose = require("mongoose");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Mess = require("../models/Mess");
const MessSubscription = require("../models/MessSubscription");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

const router = express.Router();

/* ===================== ADMIN: GET ALL BOOKINGS ===================== */
router.get(
  "/",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
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
);

/* ===================== STUDENT: CREATE BOOKING ===================== */
router.post(
  "/book/:property_id",
  authenticate,
  authorize(["student"]),
  async (req, res) => {
    try {
      const { property_id } = req.params;
      let { mealsSelected, startDate, endDate } = req.body;
      // Robustly parse mealsSelected as Boolean
      if (Array.isArray(mealsSelected)) {
        // If array contains a string 'false', treat as false, otherwise true
        if (mealsSelected.length === 1 && (mealsSelected[0] === 'false' || mealsSelected[0] === false)) {
          mealsSelected = false;
        } else if (mealsSelected.length === 1 && (mealsSelected[0] === 'true' || mealsSelected[0] === true)) {
          mealsSelected = true;
        } else {
          mealsSelected = mealsSelected.length > 0;
        }
      } else if (typeof mealsSelected === 'string') {
        // Accept 'true', 'false', '1', '0', 'yes', 'no'
        mealsSelected = /^(true|1|yes)$/i.test(mealsSelected.trim());
      } else {
        mealsSelected = Boolean(mealsSelected);
      }

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

      // 4️⃣ Prevent duplicate booking
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
);

/* ===================== ADMIN: APPROVE / REJECT ===================== */
router.patch(
  "/admin/:booking_id",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
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

      // Handle room availability transitions if booking linked to a Room
      if (booking.room) {
        const Room = require('../models/Room');
        const room = await Room.findById(booking.room);
        if (room) {
          const qty = booking.roomsCount || 1;
          await Room.findByIdAndUpdate(room._id, { $inc: { availableRooms: qty } });
          const refreshed = await Room.findById(room._id);
          if (refreshed.availableRooms > refreshed.totalRooms) {
            refreshed.availableRooms = refreshed.totalRooms;
            await refreshed.save();
          }
        }
        if (status === 'Confirmed' && prevStatus !== 'Confirmed') {
          // Atomic decrement by roomsCount: ensure availableRooms >= roomsCount then decrement
          const qty = booking.roomsCount || 1;
          const updated = await Room.findOneAndUpdate(
            { _id: room._id, availableRooms: { $gte: qty } },
            { $inc: { availableRooms: -qty } },
            { new: true }
          );
          if (!updated) {
            return res.status(400).json({ message: 'No availability for the requested number of rooms' });
          }
        }

        if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
          // Increment availability atomically by roomsCount, then cap to totalRooms
          const qty = booking.roomsCount || 1;
          await Room.findByIdAndUpdate(room._id, { $inc: { availableRooms: qty } });
          const refreshed = await Room.findById(room._id);
          if (refreshed.availableRooms > refreshed.totalRooms) {
            refreshed.availableRooms = refreshed.totalRooms;
            await refreshed.save();
          }
        }

        // Update property.isAvailable based on rooms
        const availableRoom = await require('../models/Room').findOne({ property: booking.property._id, availableRooms: { $gt: 0 } });
        await Property.findByIdAndUpdate(booking.property._id, { isAvailable: !!availableRoom });
      } else {
        // legacy property-level behavior
        if (status === 'Confirmed') {
          await Property.findByIdAndUpdate(booking.property._id, { isAvailable: false });
        }
        if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
          await Property.findByIdAndUpdate(booking.property._id, { isAvailable: true });
        }
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
);

  /* ===================== OWNER: GET BOOKINGS FOR THEIR PROPERTIES ===================== */
  router.get(
    "/owner",
    authenticate,
    authorize(["owner"]),
    async (req, res) => {
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
  );

  /* ===================== OWNER: APPROVE / REJECT FOR THEIR PROPERTY BOOKINGS ===================== */
  router.patch(
    "/owner/:booking_id",
    authenticate,
    authorize(["owner"]),
    async (req, res) => {
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

        if (booking.room) {
          const Room = require('../models/Room');
          const room = await Room.findById(booking.room);
          if (!room) return res.status(400).json({ message: 'Linked room not found' });

            if (status === 'Confirmed' && prevStatus !== 'Confirmed') {
              const qty = booking.roomsCount || 1;
              const updated = await Room.findOneAndUpdate(
                { _id: room._id, availableRooms: { $gte: qty } },
                { $inc: { availableRooms: -qty } },
                { new: true }
              );
              if (!updated) {
                return res.status(400).json({ message: 'No availability for the requested number of rooms' });
              }
            }

            if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
              const qty = booking.roomsCount || 1;
              await Room.findByIdAndUpdate(room._id, { $inc: { availableRooms: qty } });
              const refreshed = await Room.findById(room._id);
              if (refreshed.availableRooms > refreshed.totalRooms) {
                refreshed.availableRooms = refreshed.totalRooms;
                await refreshed.save();
              }
            }

          const availableRoom = await require('../models/Room').findOne({ property: booking.property._id, availableRooms: { $gt: 0 } });
          await Property.findByIdAndUpdate(booking.property._id, { isAvailable: !!availableRoom });
        } else {
          if (status === 'Confirmed') {
            await Property.findByIdAndUpdate(booking.property._id, { isAvailable: false });
          }
          if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
            await Property.findByIdAndUpdate(booking.property._id, { isAvailable: true });
          }
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
  );

/* ===================== STUDENT: MY BOOKINGS ===================== */
router.get(
  "/my",
  authenticate,
  authorize(["student"]),
  async (req, res) => {
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
);

/* ===================== STUDENT: LEAVE ROOM / END STAY ===================== */
router.patch(
  "/leave/:booking_id",
  authenticate,
  authorize(["student"]),
  async (req, res) => {
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
      // Ensure mealsSelected is Boolean before saving (fix CastError)
      if (Array.isArray(booking.mealsSelected)) {
        if (booking.mealsSelected.length === 1 && (booking.mealsSelected[0] === 'false' || booking.mealsSelected[0] === false)) {
          booking.mealsSelected = false;
        } else if (booking.mealsSelected.length === 1 && (booking.mealsSelected[0] === 'true' || booking.mealsSelected[0] === true)) {
          booking.mealsSelected = true;
        } else {
          booking.mealsSelected = booking.mealsSelected.length > 0;
        }
      } else if (typeof booking.mealsSelected === 'string') {
        booking.mealsSelected = /^(true|1|yes)$/i.test(booking.mealsSelected.trim());
      } else {
        booking.mealsSelected = Boolean(booking.mealsSelected);
      }
      await booking.save();

      // Mark property as available again
      if (booking.room) {
        const Room = require('../models/Room');
        // Atomic increment
        await Room.findByIdAndUpdate(booking.room, { $inc: { availableRooms: 1 } });
        const refreshed = await Room.findById(booking.room);
        if (refreshed && refreshed.availableRooms > refreshed.totalRooms) {
          refreshed.availableRooms = refreshed.totalRooms;
          await refreshed.save();
        }
        const availableRoom = await require('../models/Room').findOne({ property: booking.property._id, availableRooms: { $gt: 0 } });
        await Property.findByIdAndUpdate(booking.property._id, { isAvailable: !!availableRoom });
      } else {
        await Property.findByIdAndUpdate(booking.property._id, {
          isAvailable: true
        });
      }

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
);

/* ===================== STUDENT: CANCEL PENDING BOOKING ===================== */
router.patch(
  "/cancel/:booking_id",
  authenticate,
  authorize(["student"]),
  async (req, res) => {
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
);

module.exports = router;
