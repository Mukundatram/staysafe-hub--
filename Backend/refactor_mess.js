const fs = require('fs');
const path = require('path');

const routeFile = path.join(__dirname, 'src', 'routes', 'messRoutes.js');
const controllerFile = path.join(__dirname, 'src', 'controllers', 'messController.js');

let code = fs.readFileSync(routeFile, 'utf8');
code = code.replace(/\r\n/g, '\n');

const replacements = [
    { name: 'getAllMessServices', match: /router\.get\('\/', async \(req, res\) => \{/, replace: 'exports.getAllMessServices = async (req, res) => {' },
    { name: 'getMySubscriptions', match: /router\.get\('\/subscriptions\/my', protect, async \(req, res\) => \{/, replace: 'exports.getMySubscriptions = async (req, res) => {' },
    { name: 'ownerGetMyServices', match: /router\.get\('\/owner\/my-services', protect, authorize\('owner'\), async \(req, res\) => \{/, replace: 'exports.ownerGetMyServices = async (req, res) => {' },
    { name: 'ownerGetSubscriptions', match: /router\.get\('\/owner\/subscriptions', protect, authorize\('owner'\), async \(req, res\) => \{/, replace: 'exports.ownerGetSubscriptions = async (req, res) => {' },
    { name: 'getMessDetails', match: /router\.get\('\/:id', async \(req, res\) => \{/, replace: 'exports.getMessDetails = async (req, res) => {' },
    { name: 'createMessService', match: /router\.post\('\/', protect, authorize\('owner', 'admin'\), handleMessImageUpload, async \(req, res\) => \{/, replace: 'exports.createMessService = async (req, res) => {' },
    { name: 'updateMessService', match: /router\.put\('\/:id', protect, authorize\('owner', 'admin'\), async \(req, res\) => \{/, replace: 'exports.updateMessService = async (req, res) => {' },
    { name: 'deleteMessService', match: /router\.delete\('\/:id', protect, authorize\('owner', 'admin'\), async \(req, res\) => \{/, replace: 'exports.deleteMessService = async (req, res) => {' },
    { name: 'subscribeToMess', match: /router\.post\('\/:id\/subscribe', protect, async \(req, res\) => \{/, replace: 'exports.subscribeToMess = async (req, res) => {' },
    { name: 'cancelSubscription', match: /router\.patch\('\/subscriptions\/:id\/cancel', protect, async \(req, res\) => \{/, replace: 'exports.cancelSubscription = async (req, res) => {' },
    { name: 'getMessSubscribers', match: /router\.get\('\/:id\/subscribers', protect, authorize\('owner', 'admin'\), async \(req, res\) => \{/, replace: 'exports.getMessSubscribers = async (req, res) => {' },
    { name: 'approveSubscription', match: /router\.patch\('\/subscriptions\/:id\/approve', protect, authorize\('owner', 'admin'\), async \(req, res\) => \{/, replace: 'exports.approveSubscription = async (req, res) => {' },
    { name: 'rejectSubscription', match: /router\.patch\('\/subscriptions\/:id\/reject', protect, authorize\('owner', 'admin'\), async \(req, res\) => \{/, replace: 'exports.rejectSubscription = async (req, res) => {' }
];

let controllerCode = code;

controllerCode = controllerCode.replace('const express = require(\'express\');', '');
controllerCode = controllerCode.replace('const router = express.Router();', '');
controllerCode = controllerCode.replace(/module\.exports = router;/, '');
controllerCode = controllerCode.replace('const { protect, authorize } = require(\'../middleware/authMiddleware\');', '');
controllerCode = controllerCode.replace('const { handleMessImageUpload } = require(\'../middleware/uploadMiddleware\');', '');

replacements.forEach(({ match, replace }) => {
    controllerCode = controllerCode.replace(match, replace);
});

fs.writeFileSync(controllerFile, controllerCode);

const newRouterCode = `const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleMessImageUpload } = require('../middleware/uploadMiddleware');
const messController = require('../controllers/messController');

// ==================== PUBLIC ROUTES ====================
router.get('/', messController.getAllMessServices);
router.get('/subscriptions/my', protect, messController.getMySubscriptions);

// ==================== OWNER ROUTES ====================
router.get('/owner/my-services', protect, authorize('owner'), messController.ownerGetMyServices);
router.get('/owner/subscriptions', protect, authorize('owner'), messController.ownerGetSubscriptions);

// ==================== SINGLE MESS ====================
router.get('/:id', messController.getMessDetails);
router.post('/', protect, authorize('owner', 'admin'), handleMessImageUpload, messController.createMessService);
router.put('/:id', protect, authorize('owner', 'admin'), messController.updateMessService);
router.delete('/:id', protect, authorize('owner', 'admin'), messController.deleteMessService);
router.post('/:id/subscribe', protect, messController.subscribeToMess);
router.get('/:id/subscribers', protect, authorize('owner', 'admin'), messController.getMessSubscribers);

// ==================== SUBSCRIPTIONS ====================
router.patch('/subscriptions/:id/cancel', protect, messController.cancelSubscription);
router.patch('/subscriptions/:id/approve', protect, authorize('owner', 'admin'), messController.approveSubscription);
router.patch('/subscriptions/:id/reject', protect, authorize('owner', 'admin'), messController.rejectSubscription);

module.exports = router;
`;

fs.writeFileSync(routeFile, newRouterCode);
console.log('Mess refactor extraction done!');
