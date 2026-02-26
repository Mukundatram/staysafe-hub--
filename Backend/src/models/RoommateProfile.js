const mongoose = require('mongoose');

const roommateProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isProfileActive: {
        type: Boolean,
        default: true
    },

    // Location & Budget
    city: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        trim: true
    },
    budgetMin: {
        type: Number,
        required: true,
        min: 0
    },
    budgetMax: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                return value >= this.budgetMin;
            },
            message: 'Budget max must be greater than or equal to budget min'
        }
    },

    // Timeline
    expectedMoveInDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        enum: ['short-term', 'long-term'],
        required: true
    },

    // Student/Professional Info
    studentStatus: {
        type: String,
        enum: ['student', 'intern', 'working'],
        required: true
    },
    college: {
        type: String,
        trim: true
    },
    organization: {
        type: String,
        trim: true
    },
    year: {
        type: Number,
        min: 1,
        max: 6 // PhD students
    },
    batch: {
        type: String,
        trim: true
    },

    // Preferences
    genderPreference: {
        type: String,
        enum: ['male', 'female', 'any', 'non-binary'],
        default: 'any'
    },
    interests: [{
        type: String,
        trim: true
    }],

    // Lifestyle
    lifestyle: {
        sleepSchedule: {
            type: String,
            enum: ['early', 'late', 'flexible'],
            required: true
        },
        foodPreference: {
            type: String,
            enum: ['veg', 'non-veg', 'both'],
            required: true
        },
        smoking: {
            type: String,
            enum: ['no', 'occasional', 'yes'],
            required: true
        },
        guests: {
            type: String,
            enum: ['rare', 'sometimes', 'frequent'],
            required: true
        },
        cleanlinessLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true
        }
    },

    // Safety & Privacy
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Metadata
    lastActive: {
        type: Date,
        default: Date.now
    },
    viewCount: {
        type: Number,
        default: 0
    },
    connectionCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for efficient matching queries
roommateProfileSchema.index({ city: 1, isProfileActive: 1, expectedMoveInDate: 1 });
roommateProfileSchema.index({ isProfileActive: 1, city: 1 });
roommateProfileSchema.index({ college: 1, isProfileActive: 1 });

// Virtual for checking if profile is complete
roommateProfileSchema.virtual('isComplete').get(function () {
    return !!(
        this.city &&
        this.budgetMin &&
        this.budgetMax &&
        this.expectedMoveInDate &&
        this.duration &&
        this.studentStatus &&
        this.lifestyle &&
        this.lifestyle.sleepSchedule &&
        this.lifestyle.foodPreference &&
        this.lifestyle.smoking &&
        this.lifestyle.guests &&
        this.lifestyle.cleanlinessLevel
    );
});

// Method to check if user is blocked
roommateProfileSchema.methods.isUserBlocked = function (userId) {
    return this.blockedUsers.some(blockedId => blockedId.equals(userId));
};

// Method to update last active timestamp
roommateProfileSchema.methods.updateLastActive = function () {
    this.lastActive = new Date();
    return this.save();
};

// Static method to find active profiles in city
roommateProfileSchema.statics.findActiveInCity = function (city, excludeUserId = null) {
    const query = {
        city: city,
        isProfileActive: true
    };

    if (excludeUserId) {
        query.user = { $ne: excludeUserId };
    }

    return this.find(query).populate('user', 'name email gender profilePicture isVerified');
};

// Pre-save middleware to update lastActive
roommateProfileSchema.pre('save', function (next) {
    if (this.isModified() && !this.isModified('lastActive')) {
        this.lastActive = new Date();
    }
    next();
});

const RoommateProfile = mongoose.model('RoommateProfile', roommateProfileSchema);

module.exports = RoommateProfile;
