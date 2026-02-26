const Property = require("../models/Property");
const Room = require("../models/Room");

exports.getAllProperties = async (req, res) => {
    try {
        const {
            search,
            minPrice,
            maxPrice,
            location,
            amenities,
            minRating,
            available,
            hasMessService,
            sortBy,
            page = 1,
            limit = 12
        } = req.query;

        const filter = {};

        if (available !== undefined) {
            filter.isAvailable = available === 'true';
        } else {
            filter.isAvailable = true;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex }
            ];
        }

        if (minPrice || maxPrice) {
            filter.rent = {};
            if (minPrice) filter.rent.$gte = parseInt(minPrice);
            if (maxPrice) filter.rent.$lte = parseInt(maxPrice);
        }

        if (location) {
            filter.location = new RegExp(location, 'i');
        }

        if (amenities) {
            const amenityList = amenities.split(',').map(a => a.trim());
            filter.amenities = { $all: amenityList };
        }

        if (minRating) {
            filter.averageRating = { $gte: parseFloat(minRating) };
        }

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

        let sortOptions = {};
        switch (sortBy) {
            case 'price_asc': sortOptions = { rent: 1 }; break;
            case 'price_desc': sortOptions = { rent: -1 }; break;
            case 'rating_desc': sortOptions = { averageRating: -1, reviewCount: -1 }; break;
            case 'oldest': sortOptions = { createdAt: 1 }; break;
            case 'newest':
            default: sortOptions = { createdAt: -1 }; break;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .populate('owner', 'name'),
            Property.countDocuments(filter)
        ]);

        const allProperties = await Property.find({ isAvailable: true });
        const allAmenities = [...new Set(allProperties.flatMap(p => p.amenities || []))];
        const propertyRents = allProperties.map(p => p.rent || 0);
        const priceRange = {
            min: propertyRents.length ? Math.min(...propertyRents) : 0,
            max: propertyRents.length ? Math.max(...propertyRents) : 0
        };
        const locations = [...new Set(allProperties.map(p => p.location).filter(Boolean))];

        res.json({
            properties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum) || 1
            },
            filterOptions: {
                amenities: allAmenities,
                priceRange,
                locations
            }
        });
    } catch (error) {
        console.error("Error in getAllProperties:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'name email');
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        const rooms = await Room.find({ property: property._id });
        const propObj = property.toObject();
        propObj.rooms = rooms;
        res.json(propObj);
    } catch (error) {
        console.error("Error in getPropertyById:", error);
        res.status(500).json({ message: "Server error" });
    }
};
