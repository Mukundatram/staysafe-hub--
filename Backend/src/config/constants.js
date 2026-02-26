/**
 * Centralized configuration constants.
 *
 * All magic numbers and defaults that were previously scattered across
 * controllers, services, models, and route files live here.
 *
 * Environment variables OVERRIDE defaults where applicable.
 */

// ==================== AUTH ====================
const AUTH = {
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    BCRYPT_SALT_ROUNDS: 10,
    VALID_ROLES: ['student', 'owner', 'admin']
};

// ==================== UPLOADS ====================
const UPLOADS = {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024,
    ALLOWED_DOCUMENT_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    ALLOWED_DOCUMENT_CATEGORIES: [
        'student_id', 'college_id', 'aadhar', 'pan', 'passport',
        'driving_license', 'property_ownership', 'property_tax',
        'electricity_bill', 'rental_agreement', 'noc', 'other'
    ]
};

// ==================== VERIFICATION ====================
const VERIFICATION = {
    EXPIRY_DAYS: parseInt(process.env.VERIFICATION_EXPIRY_DAYS || '365', 10),
    TOKEN_EXPIRY_HOURS: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS || '24', 10),
    BOOKING_MIN_VERIFICATION: process.env.BOOKING_MIN_VERIFICATION || ''
};

// ==================== ROOMMATE ====================
const ROOMMATE = {
    REQUEST_COOLDOWN_DAYS: parseInt(process.env.ROOMMATE_COOLDOWN_DAYS || '7', 10),
    REQUEST_EXPIRY_DAYS: parseInt(process.env.ROOMMATE_REQUEST_EXPIRY_DAYS || '30', 10)
};

// ==================== AI / GROQ ====================
const AI = {
    GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    CHATBOT_MAX_TOKENS: parseInt(process.env.CHATBOT_MAX_TOKENS || '500', 10),
    DESCRIPTION_MAX_TOKENS: parseInt(process.env.DESCRIPTION_MAX_TOKENS || '1024', 10),
    TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    TOP_P: parseFloat(process.env.AI_TOP_P || '0.9'),
    MAX_CONVERSATION_HISTORY: 10
};

// ==================== PAGINATION ====================
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    ADMIN_DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// ==================== OTP ====================
const OTP = {
    LENGTH: 6,
    EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    RESEND_COOLDOWN_SECONDS: parseInt(process.env.OTP_RESEND_COOLDOWN || '60', 10),
    PENDING_USER_TTL_HOURS: parseInt(process.env.OTP_PENDING_TTL_HOURS || '1', 10)
};

// ==================== TIME HELPERS ====================
const MS_PER_DAY = 1000 * 60 * 60 * 24;

module.exports = {
    AUTH,
    UPLOADS,
    VERIFICATION,
    ROOMMATE,
    AI,
    PAGINATION,
    OTP,
    MS_PER_DAY
};
