const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const ocrService = require('../services/ocrService');
const {
    getDocumentCategory,
    updateVerificationState,
    markVerificationFailed
} = require('../services/verificationService');

/**
 * Normalizes text for better matching (lowercase, removes special chars and extra spaces)
 */
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Basic fuzzy matching: checks if all words in 'query' exist somewhere in 'text'
 */
function isFuzzyMatch(query, text) {
    if (!query || !text) return false;
    const normText = text.toLowerCase();

    // Split the query into significant words (ignore very short stop words like 'of', 'at')
    const words = query.toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 2);

    if (words.length === 0) return false;

    // Check if a majority of the significant words exist in the text
    let matchedWords = 0;
    for (const word of words) {
        if (normText.includes(word)) {
            matchedWords++;
        }
    }

    // Require at least 70% of words to match
    return (matchedWords / words.length) >= 0.7;
}

/**
 * POST /upload
 */
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { documentType, notes, propertyId, expiryDate, collegeName, graduationYear } = req.body;

        if (!documentType) {
            return res.status(400).json({ success: false, message: 'Document type is required' });
        }

        if (documentType === 'aadhar') {
            return res.status(400).json({
                success: false,
                message: 'Aadhaar document uploads are not allowed. Use Aadhaar OTP verification instead.'
            });
        }

        // Initialize metadata
        const metadata = {};
        if (collegeName) metadata.collegeName = collegeName;
        if (graduationYear) metadata.graduationYear = graduationYear;

        let status = 'pending';
        let extractedText = '';
        let isInstantlyVerified = false;

        // Automated Verification Logic for Student IDs
        if ((documentType === 'student_id' || documentType === 'college_id') && collegeName) {
            const isImage = req.file.mimetype.startsWith('image/');
            if (isImage) {
                console.log(`Starting automated OCR verification for user ${req.user.id}`);
                try {
                    // Fetch user's name
                    const user = await User.findById(req.user.id);
                    const userName = user ? user.name : '';

                    // Run OCR
                    extractedText = await ocrService.extractTextFromImage(req.file.path);
                    metadata.extractedText = extractedText;

                    if (extractedText.trim().length > 0) {
                        // Check if both Name and College Name exist in extracted text
                        const nameMatches = isFuzzyMatch(userName, extractedText);
                        const collegeMatches = isFuzzyMatch(collegeName, extractedText);

                        console.log(`OCR Results -> Name Match: ${nameMatches}, College Match: ${collegeMatches}`);

                        if (nameMatches && collegeMatches) {
                            console.log('Instant verification successful!');
                            status = 'verified';
                            isInstantlyVerified = true;
                            metadata.automatedVerification = 'success';

                            // Auto-update User profile
                            if (user) {
                                user.verificationState = 'verified_student';
                                user.college = collegeName;
                                await user.save();
                            }
                        } else {
                            console.log('Instant verification failed. Sent for manual review.');
                            metadata.automatedVerification = 'failed_no_match';
                        }
                    } else {
                        console.log('OCR extracted no text. Sent for manual review.');
                        metadata.automatedVerification = 'failed_no_text';
                    }
                } catch (ocrErr) {
                    console.error('OCR Process error:', ocrErr);
                    metadata.automatedVerification = 'error';
                }
            } else {
                metadata.automatedVerification = 'skipped_not_image';
            }
        }

        const document = new Document({
            user: req.user.id,
            documentType,
            documentCategory: getDocumentCategory(documentType),
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            notes,
            property: propertyId || undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            metadata,
            status,
            verifiedAt: isInstantlyVerified ? new Date() : undefined,
            notes: isInstantlyVerified ? 'Automatically verified by OCR' : notes
        });

        await document.save();

        if (isInstantlyVerified) {
            try {
                // To keep state consistent
                await updateVerificationState(document, 'verified');
            } catch (e) {
                console.error('Failed to update VerificationState helper after auto-verify', e);
            }
        } else {
            try {
                await User.findByIdAndUpdate(req.user.id, { verificationState: 'document_uploaded' });
            } catch (e) {
                console.error('Failed to update user verificationState after document upload', e);
            }
        }

        res.status(201).json({
            success: true,
            message: isInstantlyVerified
                ? 'Document instantly verified using OCR!'
                : 'Document uploaded successfully',
            document,
            isInstantlyVerified
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, message: 'Failed to upload document' });
    }
};

/**
 * GET /my-documents
 */
exports.getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch documents' });
    }
};

/**
 * GET /verification-status
 */
exports.getVerificationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const documents = await Document.find({ user: req.user.id });

        const identityDocs = documents.filter(d => d.documentCategory === 'identity');
        const addressDocs = documents.filter(d => d.documentCategory === 'address');
        const propertyDocs = documents.filter(d => d.documentCategory === 'property');

        const hasVerifiedIdentity = user.verificationStatus?.identity?.verified || identityDocs.some(d => d.status === 'verified');
        const hasVerifiedAddress = user.verificationStatus?.address?.verified || addressDocs.some(d => d.status === 'verified');
        const hasVerifiedProperty = user.verificationStatus?.property?.verified || propertyDocs.some(d => d.status === 'verified');

        const pendingCount = documents.filter(d => d.status === 'pending' || d.status === 'under_review').length;
        const verifiedCount = documents.filter(d => d.status === 'verified').length;
        const rejectedCount = documents.filter(d => d.status === 'rejected').length;

        let overallStatus = 'not_verified';
        if (verifiedCount > 0 && pendingCount === 0 && rejectedCount === 0) {
            overallStatus = 'verified';
        } else if (pendingCount > 0) {
            overallStatus = 'pending';
        } else if (rejectedCount > 0 && verifiedCount === 0) {
            overallStatus = 'rejected';
        } else if (verifiedCount > 0) {
            overallStatus = 'partially_verified';
        }

        res.json({
            success: true,
            verificationStatus: {
                overall: hasVerifiedIdentity && (user.role !== 'owner' || hasVerifiedProperty),
                identity: {
                    verified: hasVerifiedIdentity,
                    verifiedAt: user.verificationStatus?.identity?.verifiedAt,
                    documents: {
                        total: identityDocs.length,
                        verified: identityDocs.filter(d => d.status === 'verified').length,
                        pending: identityDocs.filter(d => d.status === 'pending' || d.status === 'under_review').length,
                        rejected: identityDocs.filter(d => d.status === 'rejected').length
                    }
                },
                address: {
                    verified: hasVerifiedAddress,
                    verifiedAt: user.verificationStatus?.address?.verifiedAt,
                    documents: {
                        total: addressDocs.length,
                        verified: addressDocs.filter(d => d.status === 'verified').length,
                        pending: addressDocs.filter(d => d.status === 'pending' || d.status === 'under_review').length,
                        rejected: addressDocs.filter(d => d.status === 'rejected').length
                    }
                },
                property: {
                    verified: hasVerifiedProperty,
                    verifiedAt: user.verificationStatus?.property?.verifiedAt,
                    documents: {
                        total: propertyDocs.length,
                        verified: propertyDocs.filter(d => d.status === 'verified').length,
                        pending: propertyDocs.filter(d => d.status === 'pending' || d.status === 'under_review').length,
                        rejected: propertyDocs.filter(d => d.status === 'rejected').length
                    }
                },
                counts: {
                    total: documents.length,
                    pending: pendingCount,
                    verified: verifiedCount,
                    rejected: rejectedCount
                }
            }
        });
    } catch (error) {
        console.error('Error fetching verification status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch verification status' });
    }
};

/**
 * GET /:id
 */
exports.getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('user', 'name email role')
            .populate('verifiedBy', 'name email');

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        if (document.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, document });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch document' });
    }
};

/**
 * GET /download/:id
 */
exports.downloadDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('user', 'name email role');
        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

        if (document.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Cloudinary URLs can be redirected directly since Cloudinary acts as the host/CDN
        return res.redirect(document.filePath);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ success: false, message: 'Failed to download document' });
    }
};

/**
 * DELETE /:id
 */
exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (document.status === 'verified') {
            return res.status(400).json({ success: false, message: 'Cannot delete verified documents' });
        }

        // Cloudinary handles its own deletion lifecycle. Or we can call Cloudinary API to destroy the asset later.
        // For now, we simply remove the document reference from the database.

        await Document.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, message: 'Failed to delete document' });
    }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /admin/pending
 */
exports.getAdminPendingDocuments = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const documents = await Document.find({
            status: { $in: ['pending', 'under_review'] }
        })
            .populate('user', 'name email role')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments({
            status: { $in: ['pending', 'under_review'] }
        });

        res.json({
            success: true,
            documents,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching pending documents:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch documents' });
    }
};

/**
 * GET /admin/user/:userId
 */
exports.getAdminUserDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.params.userId })
            .populate('user', 'name email role')
            .populate('verifiedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, documents });
    } catch (error) {
        console.error('Error fetching user documents:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch documents' });
    }
};

/**
 * PATCH /admin/verify/:id
 */
exports.adminVerifyDocument = async (req, res) => {
    try {
        const { status, rejectionReason, notes } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        const document = await Document.findById(req.params.id).populate('user', 'name email role');

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Auto-reject expired documents
        if (status === 'verified' && document.expiryDate && new Date(document.expiryDate) < new Date()) {
            document.status = 'rejected';
            document.rejectionReason = 'Document expired';
            document.verifiedBy = req.user.id;
            document.verifiedAt = new Date();
            document.notes = notes;
            await document.save();

            await markVerificationFailed(document.user._id || document.user);

            res.json({ success: false, message: 'Document expired and rejected', document });
            try {
                const targetUser = await User.findById(document.user._id || document.user).select('name email');
                if (targetUser) await notificationService.documentStatusChanged(targetUser, document, 'rejected');
            } catch (notifyErr) {
                console.error('Error sending document status notification:', notifyErr);
            }
            return;
        }

        // Apply admin decision
        document.status = status;
        document.verifiedBy = req.user.id;
        document.verifiedAt = new Date();
        document.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
        document.notes = notes;
        await document.save();

        // Update user verification state
        await updateVerificationState(document, status, req.body);

        res.json({ success: true, message: `Document ${status}`, document });

        try {
            const targetUser = await User.findById(document.user).select('name email');
            if (targetUser) {
                await notificationService.documentStatusChanged(targetUser, document, status);
            }
        } catch (notifyErr) {
            console.error('Error sending document status notification:', notifyErr);
        }
    } catch (error) {
        console.error('Error verifying document:', error);
        res.status(500).json({ success: false, message: 'Failed to verify document' });
    }
};

/**
 * PATCH /admin/review/:id — Mark as under review
 */
exports.adminMarkUnderReview = async (req, res) => {
    try {
        const document = await Document.findByIdAndUpdate(
            req.params.id,
            { status: 'under_review' },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        res.json({ success: true, message: 'Document marked as under review', document });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, message: 'Failed to update document' });
    }
};

/**
 * POST /reverify/:id
 */
exports.requestReverification = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
        if (document.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });

        const now = new Date();
        const isExpired = document.expiryDate && new Date(document.expiryDate) < now;
        if (!(document.status === 'rejected' || isExpired)) {
            return res.status(400).json({ success: false, message: 'Reverification is allowed only for rejected or expired documents' });
        }

        document.status = 'pending';
        document.rejectionReason = undefined;
        document.verifiedBy = undefined;
        document.verifiedAt = undefined;
        await document.save();

        try {
            await User.findByIdAndUpdate(req.user.id, { verificationState: 'document_uploaded' });
        } catch (e) {
            console.error('Failed to update user verificationState after reverify request', e);
        }

        res.json({ success: true, message: 'Reverification requested', document });
    } catch (error) {
        console.error('Error requesting reverification:', error);
        res.status(500).json({ success: false, message: 'Failed to request reverification' });
    }
};
