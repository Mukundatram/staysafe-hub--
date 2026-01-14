const express = require("express");
const mongoose = require("mongoose");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
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
        .populate("property", "title location isAvailable")
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
      if (!property || !property.isAvailable) {
        return res.status(400).json({ message: "Property not available" });
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

      // 5️⃣ Create booking
      const booking = await Booking.create({
        student: req.user._id,
        property: property_id,
        mealsSelected,
        startDate,
        endDate,
        status: "Pending",
      });

      // 6️⃣ Send notification to property owner
      try {
        const student = await User.findById(req.user._id);
        if (property.owner) {
          await notificationService.bookingRequested(
            booking,
            property,
            student,
            property.owner
          );
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
        // Don't fail the booking if notification fails
      }

      res.status(201).json({
        message: "Booking created successfully",
        booking,
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

      const booking = await Booking.findByIdAndUpdate(
        booking_id,
        { status },
        { new: true }
      )
        .populate("student", "email name")
        .populate({
          path: "property",
          select: "title location owner",
          populate: { path: "owner", select: "name email" }
        });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Auto update property availability
      if (status === "Confirmed") {
        await Property.findByIdAndUpdate(booking.property._id, {
          isAvailable: false,
        });
      }

      // Send notification to student
      try {
        if (status === "Confirmed") {
          await notificationService.bookingApproved(
            booking,
            booking.property,
            booking.student,
            booking.property.owner
          );
        } else if (status === "Rejected") {
          await notificationService.bookingRejected(
            booking,
            booking.property,
            booking.student,
            booking.property.owner
          );
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      res.json({
        message: `Booking ${status}`,
        booking,
      });
    } catch (error) {
      console.error("Admin booking update error:", error);
      res.status(500).json({ message: "Server error" });
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
      await Property.findByIdAndUpdate(booking.property._id, {
        isAvailable: true
      });

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
