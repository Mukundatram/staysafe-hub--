const mongoose = require('mongoose');

/**
 * Lightweight validation middleware factory.
 *
 * Usage:
 *   router.post('/foo', validate(rules), controller.foo);
 *
 * Each rule is an object:
 *   { field, location?, type?, required?, min?, max?, maxLength?, oneOf?, custom? }
 *
 *  - field:     req.body / req.params / req.query key name
 *  - location:  'body' (default) | 'params' | 'query'
 *  - type:      'string' | 'number' | 'boolean' | 'mongoId' | 'date' | 'array'
 *  - required:  true/false (default false)
 *  - min/max:   for numbers
 *  - maxLength: for strings
 *  - oneOf:     array of allowed values
 *  - custom:    function(value, req) => string|null (null = pass)
 */
function validate(rules) {
    return (req, res, next) => {
        const errors = [];

        for (const rule of rules) {
            const location = rule.location || 'body';
            const source = req[location];
            const value = source ? source[rule.field] : undefined;
            const label = rule.label || rule.field;

            // Required check
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`${label} is required`);
                continue;
            }

            // Skip further checks if value is not present and not required
            if (value === undefined || value === null || value === '') continue;

            // Type checks
            if (rule.type === 'mongoId') {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    errors.push(`${label} must be a valid ID`);
                }
            }

            if (rule.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`${label} must be a number`);
                } else {
                    if (rule.min !== undefined && num < rule.min) {
                        errors.push(`${label} must be at least ${rule.min}`);
                    }
                    if (rule.max !== undefined && num > rule.max) {
                        errors.push(`${label} must be at most ${rule.max}`);
                    }
                }
            }

            if (rule.type === 'string' && typeof value !== 'string') {
                errors.push(`${label} must be a string`);
            }

            if (rule.type === 'date') {
                if (isNaN(Date.parse(value))) {
                    errors.push(`${label} must be a valid date`);
                }
            }

            if (rule.type === 'array' && !Array.isArray(value)) {
                errors.push(`${label} must be an array`);
            }

            // Max length
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                errors.push(`${label} must be at most ${rule.maxLength} characters`);
            }

            // Enum
            if (rule.oneOf && !rule.oneOf.includes(value)) {
                errors.push(`${label} must be one of: ${rule.oneOf.join(', ')}`);
            }

            // Custom validator
            if (rule.custom) {
                const err = rule.custom(value, req);
                if (err) errors.push(err);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
}

// ==================== PRE-BUILT RULE SETS ====================

const bookingRules = [
    { field: 'property_id', location: 'params', type: 'mongoId', required: true, label: 'Property ID' },
    { field: 'startDate', type: 'date', required: true, label: 'Start date' },
    { field: 'endDate', type: 'date', required: true, label: 'End date' },
    {
        field: 'endDate',
        custom: (val, req) => {
            if (req.body.startDate && new Date(req.body.startDate) >= new Date(val)) {
                return 'End date must be after start date';
            }
            return null;
        }
    }
];

const reviewRules = [
    { field: 'rating', type: 'number', required: true, min: 1, max: 5, label: 'Rating' },
    { field: 'comment', type: 'string', maxLength: 2000, label: 'Comment' },
    {
        field: 'bookingId',
        custom: (val, req) => {
            if (!val && !req.body.messSubscriptionId) {
                return 'Either bookingId or messSubscriptionId is required';
            }
            return null;
        }
    }
];

const documentUploadRules = [
    { field: 'documentType', required: true, label: 'Document type' }
];

const agreementCreateRules = [
    { field: 'bookingId', type: 'mongoId', required: true, label: 'Booking ID' },
    { field: 'monthlyRent', type: 'number', min: 0, label: 'Monthly rent' },
    { field: 'securityDeposit', type: 'number', min: 0, label: 'Security deposit' },
    { field: 'noticePeriod', type: 'number', min: 1, max: 365, label: 'Notice period' }
];

const adminVerifyDocumentRules = [
    { field: 'status', required: true, oneOf: ['verified', 'rejected'], label: 'Status' },
    {
        field: 'rejectionReason',
        custom: (val, req) => {
            if (req.body.status === 'rejected' && !val) {
                return 'Rejection reason is required when rejecting';
            }
            return null;
        }
    }
];

module.exports = {
    validate,
    bookingRules,
    reviewRules,
    documentUploadRules,
    agreementCreateRules,
    adminVerifyDocumentRules
};
