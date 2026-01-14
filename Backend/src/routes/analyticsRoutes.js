const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Owner Analytics - Get dashboard statistics
router.get('/owner/stats', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get all owner's properties
    const properties = await Property.find({ owner: ownerId });
    const propertyIds = properties.map(p => p._id);

    // Get all bookings for owner's properties
    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('property', 'title rent');

    // Calculate statistics
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.isAvailable).length;
    const occupiedProperties = totalProperties - availableProperties;
    const occupancyRate = totalProperties > 0 
      ? Math.round((occupiedProperties / totalProperties) * 100) 
      : 0;

    // Revenue calculations
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      const months = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24 * 30));
      return sum + (booking.property?.rent || 0) * Math.max(months, 1);
    }, 0);

    // Monthly revenue for last 6 months
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = confirmedBookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const revenue = monthBookings.reduce((sum, booking) => {
        const months = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24 * 30));
        return sum + (booking.property?.rent || 0) * Math.max(months, 1);
      }, 0);

      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: monthStart.getFullYear(),
        revenue
      });
    }

    // Booking statistics
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
    const completedCount = bookings.filter(b => b.status === 'Completed').length;
    const rejectedCount = bookings.filter(b => b.status === 'Rejected').length;

    // Property performance
    const propertyPerformance = await Promise.all(properties.map(async (property) => {
      const propertyBookings = bookings.filter(b => b.property?._id?.toString() === property._id.toString());
      const propertyRevenue = propertyBookings
        .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
        .reduce((sum, b) => {
          const months = Math.ceil((new Date(b.endDate) - new Date(b.startDate)) / (1000 * 60 * 60 * 24 * 30));
          return sum + property.rent * Math.max(months, 1);
        }, 0);

      return {
        id: property._id,
        title: property.title,
        rent: property.rent,
        isAvailable: property.isAvailable,
        totalBookings: propertyBookings.length,
        confirmedBookings: propertyBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length,
        revenue: propertyRevenue,
        rating: property.averageRating || 0,
        reviewCount: property.reviewCount || 0
      };
    }));

    res.json({
      success: true,
      stats: {
        properties: {
          total: totalProperties,
          available: availableProperties,
          occupied: occupiedProperties,
          occupancyRate
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          averagePerProperty: totalProperties > 0 ? Math.round(totalRevenue / totalProperties) : 0
        },
        bookings: {
          total: bookings.length,
          pending: pendingBookings,
          confirmed: confirmedCount,
          completed: completedCount,
          rejected: rejectedCount
        },
        propertyPerformance: propertyPerformance.sort((a, b) => b.revenue - a.revenue)
      }
    });
  } catch (error) {
    console.error('Error fetching owner analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
});

// Admin Analytics - Get platform statistics
router.get('/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const owners = await User.countDocuments({ role: 'owner' });
    const admins = await User.countDocuments({ role: 'admin' });
    const verifiedUsers = await User.countDocuments({ 'verificationStatus.isFullyVerified': true });

    // User growth - last 6 months
    const userGrowth = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const newUsers = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const newStudents = await User.countDocuments({
        role: 'student',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const newOwners = await User.countDocuments({
        role: 'owner',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      userGrowth.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: monthStart.getFullYear(),
        total: newUsers,
        students: newStudents,
        owners: newOwners
      });
    }

    // Property statistics
    const totalProperties = await Property.countDocuments();
    const availableProperties = await Property.countDocuments({ isAvailable: true });
    const avgRent = await Property.aggregate([
      { $group: { _id: null, avgRent: { $avg: '$rent' } } }
    ]);

    // Booking statistics
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const rejectedBookings = await Booking.countDocuments({ status: 'Rejected' });

    // Booking trends - last 6 months
    const bookingTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = await Booking.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthConfirmed = await Booking.countDocuments({
        status: { $in: ['Confirmed', 'Completed'] },
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      bookingTrends.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: monthStart.getFullYear(),
        total: monthBookings,
        confirmed: monthConfirmed
      });
    }

    // Platform revenue estimation (from confirmed bookings)
    const allConfirmedBookings = await Booking.find({ 
      status: { $in: ['Confirmed', 'Completed'] } 
    }).populate('property', 'rent');

    const platformRevenue = allConfirmedBookings.reduce((sum, booking) => {
      const months = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24 * 30));
      return sum + (booking.property?.rent || 0) * Math.max(months, 1);
    }, 0);

    // Monthly platform revenue
    const monthlyPlatformRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = allConfirmedBookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const revenue = monthBookings.reduce((sum, booking) => {
        const months = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24 * 30));
        return sum + (booking.property?.rent || 0) * Math.max(months, 1);
      }, 0);

      monthlyPlatformRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: monthStart.getFullYear(),
        revenue
      });
    }

    // Recent activity
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name email')
      .populate('property', 'title');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Top properties by bookings
    const topProperties = await Booking.aggregate([
      { $group: { _id: '$property', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
      { $unwind: '$property' },
      { $project: { 
        _id: 1, 
        bookingCount: 1, 
        title: '$property.title', 
        rent: '$property.rent',
        rating: '$property.averageRating'
      }}
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students,
          owners,
          admins,
          verified: verifiedUsers,
          growth: userGrowth
        },
        properties: {
          total: totalProperties,
          available: availableProperties,
          occupied: totalProperties - availableProperties,
          averageRent: avgRent[0]?.avgRent || 0
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          rejected: rejectedBookings,
          trends: bookingTrends
        },
        revenue: {
          total: platformRevenue,
          monthly: monthlyPlatformRevenue
        },
        recentActivity: {
          bookings: recentBookings,
          users: recentUsers
        },
        topProperties
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
});

module.exports = router;
