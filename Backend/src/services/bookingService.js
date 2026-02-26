const Room = require('../models/Room');
const Property = require('../models/Property');
const User = require('../models/User');
const { VERIFICATION } = require('../config/constants');

/**
 * Coerce a mealsSelected value into a proper Boolean.
 * Handles arrays, strings ('true'/'false'/'1'/'0'/'yes'/'no'), and other types.
 *
 * This logic is needed because the frontend sometimes sends mealsSelected
 * as an array with a single element, or as a string.
 *
 * @param {*} value - raw mealsSelected value from request or DB
 * @returns {boolean}
 */
function coerceMealsSelected(value) {
    if (Array.isArray(value)) {
        if (value.length === 1 && (value[0] === 'false' || value[0] === false)) {
            return false;
        } else if (value.length === 1 && (value[0] === 'true' || value[0] === true)) {
            return true;
        } else {
            return value.length > 0;
        }
    } else if (typeof value === 'string') {
        return /^(true|1|yes)$/i.test(value.trim());
    } else {
        return Boolean(value);
    }
}

/**
 * Check if a user's identity verification is still fresh
 * (i.e. within VERIFICATION_EXPIRY_DAYS of being verified).
 *
 * @param {Object} user - Mongoose user document
 * @returns {boolean}
 */
function isVerificationFresh(user) {
    try {
        const days = VERIFICATION.EXPIRY_DAYS;
        const verifiedAt = user?.verificationStatus?.identity?.verifiedAt;
        if (!verifiedAt) return false;
        const ageDays = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays <= days;
    } catch (e) {
        return false;
    }
}

/**
 * Check if a user's Aadhaar verification is still fresh.
 *
 * @param {Object} user - Mongoose user document
 * @returns {boolean}
 */
function isAadhaarFresh(user) {
    try {
        const days = parseInt(process.env.VERIFICATION_EXPIRY_DAYS || '365', 10);
        const verifiedAt = user?.aadhaarVerification?.verifiedAt;
        if (!verifiedAt) return false;
        const ageDays = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays <= days;
    } catch (e) {
        return false;
    }
}

/**
 * Check whether a user meets the minimum verification requirement for booking.
 *
 * @param {string} userId - User's ObjectId
 * @returns {Promise<boolean>}
 */
async function meetsBookingVerification(userId) {
    const minVerification = process.env.BOOKING_MIN_VERIFICATION || '';
    if (!minVerification) return true; // no gate configured

    const user = await User.findById(userId)
        .select('verificationState aadhaarVerification verificationStatus role');

    const aadhaarVerified = user?.aadhaarVerification?.verified && isAadhaarFresh(user);
    const identityVerified = user?.verificationStatus?.identity?.verified && isVerificationFresh(user);
    const isFully = user?.verificationStatus?.isFullyVerified && isVerificationFresh(user);
    const stateMatches = user?.verificationState === minVerification;

    return aadhaarVerified || identityVerified || isFully || stateMatches;
}

/**
 * Synchronize room availability when a booking status changes.
 *
 * Handles three scenarios:
 *  1. Transitioning TO Confirmed   → atomically decrement room count
 *  2. Transitioning FROM Confirmed  → atomically increment room count (capped at totalRooms)
 *  3. Always syncs property.isAvailable based on remaining rooms
 *
 * For legacy (no room) bookings, toggles property.isAvailable directly.
 *
 * @param {Object} booking   - Mongoose booking document (with .room, .roomsCount, .property)
 * @param {string} prevStatus - Previous booking status
 * @param {string} newStatus  - New booking status
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function syncRoomAvailability(booking, prevStatus, newStatus) {
    const propertyId = booking.property?._id || booking.property;

    if (booking.room) {
        const room = await Room.findById(booking.room);
        if (!room) return { ok: false, error: 'Linked room not found' };

        const qty = booking.roomsCount || 1;

        // Decrement when confirming
        if (newStatus === 'Confirmed' && prevStatus !== 'Confirmed') {
            const updated = await Room.findOneAndUpdate(
                { _id: room._id, availableRooms: { $gte: qty } },
                { $inc: { availableRooms: -qty } },
                { new: true }
            );
            if (!updated) {
                return { ok: false, error: 'No availability for the requested number of rooms' };
            }
        }

        // Increment when leaving confirmed
        if (prevStatus === 'Confirmed' && newStatus !== 'Confirmed') {
            await Room.findByIdAndUpdate(room._id, { $inc: { availableRooms: qty } });
            const refreshed = await Room.findById(room._id);
            if (refreshed && refreshed.availableRooms > refreshed.totalRooms) {
                refreshed.availableRooms = refreshed.totalRooms;
                await refreshed.save();
            }
        }

        // Sync property.isAvailable based on any room with availability
        const availableRoom = await Room.findOne({ property: propertyId, availableRooms: { $gt: 0 } });
        await Property.findByIdAndUpdate(propertyId, { isAvailable: !!availableRoom });
    } else {
        // Legacy property-level behavior (no rooms)
        if (newStatus === 'Confirmed') {
            await Property.findByIdAndUpdate(propertyId, { isAvailable: false });
        }
        if (prevStatus === 'Confirmed' && newStatus !== 'Confirmed') {
            await Property.findByIdAndUpdate(propertyId, { isAvailable: true });
        }
    }

    return { ok: true };
}

/**
 * Release room availability when a booking is completed (student leaves).
 * Simplified version of syncRoomAvailability for the leave-room case.
 *
 * @param {Object} booking - Mongoose booking document
 * @returns {Promise<void>}
 */
async function releaseRoomAvailability(booking) {
    return syncRoomAvailability(booking, 'Confirmed', 'Completed');
}

module.exports = {
    coerceMealsSelected,
    isVerificationFresh,
    isAadhaarFresh,
    meetsBookingVerification,
    syncRoomAvailability,
    releaseRoomAvailability
};
