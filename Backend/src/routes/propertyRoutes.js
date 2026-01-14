const express = require("express");
const Property = require("../models/Property");
const router = express.Router();

/* ================= GET ALL PROPERTIES WITH ADVANCED FILTERING ================= */
router.get("/", async (req, res) => {
  try {
    const {
      // Search query
      search,
      // Price filters
      minPrice,
      maxPrice,
      // Location filter
      location,
      // Amenities filter (comma-separated)
      amenities,
      // Rating filter
      minRating,
      // Availability
      available,
      // Property type (with meals / without meals)
      hasMessService,
      // Sorting
      sortBy, // price_asc, price_desc, rating_desc, newest, oldest
      // Pagination
      page = 1,
      limit = 12
    } = req.query;

    // Build filter query
    const filter = {};

    // Availability filter (default: show available only)
    if (available !== undefined) {
      filter.isAvailable = available === 'true';
    } else {
      filter.isAvailable = true;
    }

    // Search filter (title, description, location)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.rent = {};
      if (minPrice) filter.rent.$gte = parseInt(minPrice);
      if (maxPrice) filter.rent.$lte = parseInt(maxPrice);
    }

    // Location filter
    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    // Amenities filter (must have all specified amenities)
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      filter.amenities = { $all: amenityList };
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Mess service filter
    if (hasMessService !== undefined) {
      if (hasMessService === 'true') {
        filter.meals = { $exists: true, $ne: [] };
      } else {
        filter.$or = [
          { meals: { $exists: false } },
          { meals: { $size: 0 } }
        ];
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions = { rent: 1 };
        break;
      case 'price_desc':
        sortOptions = { rent: -1 };
        break;
      case 'rating_desc':
        sortOptions = { averageRating: -1, reviewCount: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name'),
      Property.countDocuments(filter)
    ]);

    // Get filter options for frontend (available amenities, price range, etc.)
    const allProperties = await Property.find({ isAvailable: true });
    const allAmenities = [...new Set(allProperties.flatMap(p => p.amenities || []))];
    const priceRange = {
      min: Math.min(...allProperties.map(p => p.rent || 0)),
      max: Math.max(...allProperties.map(p => p.rent || 0))
    };
    const locations = [...new Set(allProperties.map(p => p.location).filter(Boolean))];

    res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filterOptions: {
        amenities: allAmenities,
        priceRange,
        locations
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET PROPERTY BY ID ================= */
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email');
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
