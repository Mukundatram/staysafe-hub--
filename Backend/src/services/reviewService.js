const mongoose = require('mongoose');
const Review = require('../models/Review');

/**
 * Build a sort object from a human-readable sort string.
 *
 * @param {string} sort - One of 'newest', 'oldest', 'highest', 'lowest'
 * @returns {Object} Mongoose sort object
 */
function buildSortObject(sort) {
    switch (sort) {
        case 'oldest': return { createdAt: 1 };
        case 'highest': return { rating: -1, createdAt: -1 };
        case 'lowest': return { rating: 1, createdAt: -1 };
        default: return { createdAt: -1 };
    }
}

/**
 * Fetch paginated reviews and rating distribution for a given filter.
 *
 * This eliminates the identical aggregation pipeline that was
 * duplicated in getPropertyReviews and getMessReviews.
 *
 * @param {Object} filter      - Mongoose filter (e.g. { property: id } or { mess: id })
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} options.sort - 'newest' | 'oldest' | 'highest' | 'lowest'
 * @returns {Promise<{reviews, pagination, ratingDistribution}>}
 */
async function getReviewsWithDistribution(filter, { page = 1, limit = 10, sort = 'newest' } = {}) {
    const sortObj = buildSortObject(sort);
    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
        .populate('student', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

    const total = await Review.countDocuments(filter);

    // Convert the filter's ObjectId strings for the aggregation match
    const matchFilter = {};
    for (const [key, value] of Object.entries(filter)) {
        matchFilter[key] = typeof value === 'string'
            ? new mongoose.Types.ObjectId(value)
            : value;
    }

    const ratingAgg = await Review.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingAgg.forEach(item => {
        distribution[item._id] = item.count;
    });

    return {
        reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        ratingDistribution: distribution
    };
}

module.exports = {
    buildSortObject,
    getReviewsWithDistribution
};
