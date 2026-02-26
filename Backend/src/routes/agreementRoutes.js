const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const agreementController = require('../controllers/agreementController');
const { validate, agreementCreateRules } = require('../middleware/validate');

// ==================== AGREEMENT ROUTES ====================
router.post('/create', authenticate, validate(agreementCreateRules), agreementController.createAgreement);
router.get('/my-agreements', authenticate, agreementController.getMyAgreements);
router.get('/booking/:bookingId', authenticate, agreementController.getAgreementByBooking);
router.post('/:id/sign', authenticate, agreementController.signAgreement);
router.post('/:id/terminate', authenticate, agreementController.terminateAgreement);
router.patch('/:id', authenticate, agreementController.updateAgreement);
router.delete('/:id', authenticate, agreementController.cancelAgreement);

// ==================== SINGLE AGREEMENT (generic param — must be LAST) ====================
router.get('/:id', authenticate, agreementController.getAgreementById);

module.exports = router;
