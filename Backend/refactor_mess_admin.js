const fs = require('fs');
const path = require('path');

const routeFile = path.join(__dirname, 'src', 'routes', 'messAdminRoutes.js');
const controllerFile = path.join(__dirname, 'src', 'controllers', 'messAdminController.js');

let code = fs.readFileSync(routeFile, 'utf8');
code = code.replace(/\r\n/g, '\n');

const replacements = [
    { match: /router\.get\('\/mess', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminGetAllMessServices = async (req, res) => {' },
    { match: /router\.patch\('\/mess\/:id\/verify-hygiene', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminVerifyHygiene = async (req, res) => {' },
    { match: /router\.patch\('\/mess\/:id\/toggle-active', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminToggleActive = async (req, res) => {' },
    { match: /router\.get\('\/mess\/subscriptions', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminGetSubscriptions = async (req, res) => {' },
    { match: /router\.get\('\/mess\/audits', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminGetAudits = async (req, res) => {' },
    { match: /router\.get\('\/mess\/stats', protect, authorize\('admin'\), async \(req, res\) => \{/g, replace: 'exports.adminGetStats = async (req, res) => {' }
];

let controllerCode = code;

controllerCode = controllerCode.replace('const express = require(\'express\');', '');
controllerCode = controllerCode.replace('const router = express.Router();', '');
controllerCode = controllerCode.replace(/module\.exports = router;/, '');
controllerCode = controllerCode.replace('const { protect, authorize } = require(\'../middleware/authMiddleware\');', '');

replacements.forEach(({ match, replace }) => {
    controllerCode = controllerCode.replace(match, replace);
});

fs.writeFileSync(controllerFile, controllerCode);

const newRouterCode = `const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const messAdminController = require('../controllers/messAdminController');

// ==================== ADMIN MESS ROUTES ====================

router.get('/mess', protect, authorize('admin'), messAdminController.adminGetAllMessServices);
router.patch('/mess/:id/verify-hygiene', protect, authorize('admin'), messAdminController.adminVerifyHygiene);
router.patch('/mess/:id/toggle-active', protect, authorize('admin'), messAdminController.adminToggleActive);
router.get('/mess/subscriptions', protect, authorize('admin'), messAdminController.adminGetSubscriptions);
router.get('/mess/audits', protect, authorize('admin'), messAdminController.adminGetAudits);
router.get('/mess/stats', protect, authorize('admin'), messAdminController.adminGetStats);

module.exports = router;
`;

fs.writeFileSync(routeFile, newRouterCode);
console.log('Mess Admin refactor extraction done!');
