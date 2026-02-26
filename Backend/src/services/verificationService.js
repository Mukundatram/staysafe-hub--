const User = require('../models/User');

/**
 * Document type → verification category mapping.
 *
 * @param {string} docType - Document type string from upload
 * @returns {string} Category: 'identity' | 'property' | 'address' | 'other'
 */
function getDocumentCategory(docType) {
    const categories = {
        student_id: 'identity',
        college_id: 'identity',
        aadhar: 'identity',
        pan: 'identity',
        passport: 'identity',
        driving_license: 'identity',
        property_ownership: 'property',
        property_tax: 'property',
        electricity_bill: 'address',
        rental_agreement: 'property',
        noc: 'property',
        other: 'other'
    };
    return categories[docType] || 'other';
}

/**
 * Update a user's verification state after an admin verifies or rejects a document.
 *
 * This consolidates the complex state-transition logic that was inline in
 * documentController.adminVerifyDocument.
 *
 * @param {Object} document - Mongoose Document (must have .user, .documentCategory, .documentType, .status, .rejectionReason)
 * @param {string} status   - 'verified' | 'rejected'
 * @param {Object} [adminReqBody] - Partial req.body from admin (may contain .nameMatches)
 * @returns {Promise<void>}
 */
async function updateVerificationState(document, status, adminReqBody = {}) {
    try {
        const userId = document.user?._id || document.user;
        const u = await User.findById(userId);
        if (!u) return;

        u.verificationStatus = u.verificationStatus || {};
        u.verificationStatus.identity = u.verificationStatus.identity || {};

        if (status === 'verified' && document.documentCategory === 'identity') {
            u.verificationStatus.identity.verified = true;
            u.verificationStatus.identity.verifiedAt = new Date();
            u.verificationStatus.identity.documentId = document._id;

            const studentDocTypes = ['student_id', 'college_id'];
            if (studentDocTypes.includes(document.documentType)) {
                u.verificationState = 'verified_student';
            } else {
                u.verificationState = 'verified_intern';
            }
        } else if (status === 'rejected') {
            if (adminReqBody.nameMatches === false) {
                u.verificationState = 'verification_failed';
            }
            if (document.rejectionReason === 'Document expired') {
                u.verificationState = 'verification_failed';
            }
        }

        await u.save();
    } catch (e) {
        console.error('Failed to update user verification state:', e);
    }
}

/**
 * Mark a user's verification as failed (e.g. expired document auto-rejection).
 *
 * @param {string|Object} userId - User ID or populated user
 * @returns {Promise<void>}
 */
async function markVerificationFailed(userId) {
    try {
        const id = userId?._id || userId;
        const u = await User.findById(id);
        if (u) {
            u.verificationState = 'verification_failed';
            await u.save();
        }
    } catch (e) {
        console.error('Failed to mark user verification as failed:', e);
    }
}

module.exports = {
    getDocumentCategory,
    updateVerificationState,
    markVerificationFailed
};
