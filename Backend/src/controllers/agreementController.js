const Agreement = require('../models/Agreement');
const Booking = require('../models/Booking');

// Default agreement terms
const defaultTerms = [
    {
        title: 'Payment Terms',
        description: 'Rent is due on the 1st of each month. A grace period of 5 days is allowed. Late payment will incur a penalty of 2% per week.'
    },
    {
        title: 'Security Deposit',
        description: 'Security deposit will be refunded within 30 days of vacating the premises, after deducting any damages or outstanding dues.'
    },
    {
        title: 'Maintenance',
        description: 'Tenant is responsible for day-to-day maintenance. Major repairs will be handled by the owner.'
    },
    {
        title: 'Utilities',
        description: 'Electricity and water charges are to be paid separately by the tenant based on actual consumption.'
    },
    {
        title: 'Visitors',
        description: 'Overnight guests must be informed to the owner in advance. No subletting is allowed.'
    }
];

const defaultRules = [
    'No smoking inside the premises',
    'No illegal activities allowed',
    'Maintain cleanliness and hygiene',
    'Follow quiet hours from 10 PM to 7 AM',
    'No structural modifications without permission',
    'Pet policy as per property rules'
];

/**
 * POST /create
 */
exports.createAgreement = async (req, res) => {
    try {
        const {
            bookingId, startDate, endDate, monthlyRent, securityDeposit,
            maintenanceCharges, terms, rules, includedServices, noticePeriod, agreementType
        } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('property')
            .populate('user');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only property owner can create agreement' });
        }

        const existingAgreement = await Agreement.findOne({ booking: bookingId });
        if (existingAgreement) {
            return res.status(400).json({ success: false, message: 'Agreement already exists for this booking' });
        }

        const agreement = new Agreement({
            booking: bookingId,
            property: booking.property._id,
            student: booking.user._id,
            owner: req.user.id,
            agreementType: agreementType || 'rental',
            startDate: startDate || booking.startDate,
            endDate: endDate || booking.endDate,
            monthlyRent: monthlyRent || booking.property.rent,
            securityDeposit: securityDeposit || booking.property.rent * 2,
            maintenanceCharges: maintenanceCharges || 0,
            terms: terms || defaultTerms,
            rules: rules || defaultRules,
            includedServices: includedServices || booking.property.amenities || [],
            noticePeriod: noticePeriod || 30,
            status: 'pending_student'
        });

        await agreement.save();

        await agreement.populate([
            { path: 'property', select: 'title location images' },
            { path: 'student', select: 'name email' },
            { path: 'owner', select: 'name email' }
        ]);

        res.status(201).json({ success: true, message: 'Agreement created successfully', agreement });
    } catch (error) {
        console.error('Error creating agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to create agreement' });
    }
};

/**
 * GET /my-agreements
 */
exports.getMyAgreements = async (req, res) => {
    try {
        const { role = 'all', status } = req.query;

        let query = {};
        if (role === 'student') {
            query.student = req.user.id;
        } else if (role === 'owner') {
            query.owner = req.user.id;
        } else {
            query.$or = [{ student: req.user.id }, { owner: req.user.id }];
        }

        if (status) {
            query.status = status;
        }

        const agreements = await Agreement.find(query)
            .populate('property', 'title location images')
            .populate('student', 'name email')
            .populate('owner', 'name email')
            .populate('booking')
            .sort({ createdAt: -1 });

        res.json({ success: true, agreements });
    } catch (error) {
        console.error('Error fetching agreements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch agreements' });
    }
};

/**
 * GET /:id
 */
exports.getAgreementById = async (req, res) => {
    try {
        const agreement = await Agreement.findById(req.params.id)
            .populate('property', 'title location images amenities rent')
            .populate('student', 'name email')
            .populate('owner', 'name email phone')
            .populate('booking');

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found' });
        }

        if (
            agreement.student._id.toString() !== req.user.id &&
            agreement.owner._id.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, agreement });
    } catch (error) {
        console.error('Error fetching agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch agreement' });
    }
};

/**
 * GET /booking/:bookingId
 */
exports.getAgreementByBooking = async (req, res) => {
    try {
        const agreement = await Agreement.findOne({ booking: req.params.bookingId })
            .populate('property', 'title location images amenities rent')
            .populate('student', 'name email')
            .populate('owner', 'name email phone')
            .populate('booking');

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found for this booking' });
        }

        if (
            agreement.student._id.toString() !== req.user.id &&
            agreement.owner._id.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, agreement });
    } catch (error) {
        console.error('Error fetching agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch agreement' });
    }
};

/**
 * POST /:id/sign
 */
exports.signAgreement = async (req, res) => {
    try {
        const { signatureData } = req.body;
        const agreement = await Agreement.findById(req.params.id);

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found' });
        }

        const isStudent = agreement.student.toString() === req.user.id;
        const isOwner = agreement.owner.toString() === req.user.id;

        if (!isStudent && !isOwner) {
            return res.status(403).json({ success: false, message: 'You are not party to this agreement' });
        }

        if (isStudent && agreement.studentSignature.signed) {
            return res.status(400).json({ success: false, message: 'You have already signed this agreement' });
        }

        if (isOwner && agreement.ownerSignature.signed) {
            return res.status(400).json({ success: false, message: 'You have already signed this agreement' });
        }

        const signatureUpdate = {
            signed: true,
            signedAt: new Date(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            signatureData: signatureData || `Digitally signed by ${req.user.name}`
        };

        if (isStudent) {
            agreement.studentSignature = signatureUpdate;
            agreement.status = agreement.ownerSignature.signed ? 'active' : 'pending_owner';
        } else {
            agreement.ownerSignature = signatureUpdate;
            agreement.status = agreement.studentSignature.signed ? 'active' : 'pending_student';
        }

        await agreement.save();

        if (agreement.status === 'active') {
            await Booking.findByIdAndUpdate(agreement.booking, {
                status: 'confirmed',
                agreementSigned: true
            });
        }

        await agreement.populate([
            { path: 'property', select: 'title location' },
            { path: 'student', select: 'name email' },
            { path: 'owner', select: 'name email' }
        ]);

        res.json({ success: true, message: 'Agreement signed successfully', agreement });
    } catch (error) {
        console.error('Error signing agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to sign agreement' });
    }
};

/**
 * PATCH /:id — Update agreement (owner only, before signing)
 */
exports.updateAgreement = async (req, res) => {
    try {
        const agreement = await Agreement.findById(req.params.id);

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found' });
        }

        if (agreement.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only owner can update agreement' });
        }

        if (agreement.studentSignature.signed && agreement.ownerSignature.signed) {
            return res.status(400).json({ success: false, message: 'Cannot update a fully signed agreement' });
        }

        const allowedUpdates = [
            'startDate', 'endDate', 'monthlyRent', 'securityDeposit',
            'maintenanceCharges', 'terms', 'rules', 'includedServices',
            'noticePeriod', 'notes'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                agreement[field] = req.body[field];
            }
        });

        if (agreement.studentSignature.signed) {
            agreement.studentSignature = { signed: false };
            agreement.status = 'pending_student';
        }

        await agreement.save();

        await agreement.populate([
            { path: 'property', select: 'title location' },
            { path: 'student', select: 'name email' },
            { path: 'owner', select: 'name email' }
        ]);

        res.json({ success: true, message: 'Agreement updated successfully', agreement });
    } catch (error) {
        console.error('Error updating agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to update agreement' });
    }
};

/**
 * POST /:id/terminate
 */
exports.terminateAgreement = async (req, res) => {
    try {
        const { reason } = req.body;
        const agreement = await Agreement.findById(req.params.id);

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found' });
        }

        const isStudent = agreement.student.toString() === req.user.id;
        const isOwner = agreement.owner.toString() === req.user.id;

        if (!isStudent && !isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (agreement.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Only active agreements can be terminated' });
        }

        agreement.status = 'terminated';
        agreement.terminatedBy = req.user.id;
        agreement.terminationReason = reason;
        agreement.terminationDate = new Date();

        await agreement.save();

        await Booking.findByIdAndUpdate(agreement.booking, { status: 'cancelled' });

        res.json({ success: true, message: 'Agreement terminated successfully', agreement });
    } catch (error) {
        console.error('Error terminating agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to terminate agreement' });
    }
};

/**
 * DELETE /:id — Cancel agreement (before signing)
 */
exports.cancelAgreement = async (req, res) => {
    try {
        const agreement = await Agreement.findById(req.params.id);

        if (!agreement) {
            return res.status(404).json({ success: false, message: 'Agreement not found' });
        }

        if (agreement.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (agreement.status === 'active') {
            return res.status(400).json({ success: false, message: 'Cannot delete active agreement. Use terminate instead.' });
        }

        await Agreement.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Agreement cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling agreement:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel agreement' });
    }
};
