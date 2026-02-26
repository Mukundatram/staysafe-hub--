const fs = require('fs');
const path = require('path');

const routeFile = path.join(__dirname, 'src', 'routes', 'bookingRoutes.js');
const controllerFile = path.join(__dirname, 'src', 'controllers', 'bookingController.js');

let code = fs.readFileSync(routeFile, 'utf8');
code = code.replace(/\r\n/g, '\n');

console.log('Initial length:', code.length);

const replacements = [
    { name: 'getAllBookings', match: /router\.get\(\s*\"\/\"\,\s*authenticate\,\s*authorize\(\[\"admin\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.getAllBookings = async (req, res) => {' },
    { name: 'createBooking', match: /router\.post\(\s*\"\/book\/:property_id\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.createBooking = async (req, res) => {' },
    { name: 'adminUpdateBooking', match: /router\.patch\(\s*\"\/admin\/:booking_id\"\,\s*authenticate\,\s*authorize\(\[\"admin\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.adminUpdateBooking = async (req, res) => {' },
    { name: 'adminCreateBooking', match: /router\.post\(\s*\"\/admin\/create-booking\"\,\s*authenticate\,\s*authorize\(\[\"admin\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.adminCreateBooking = async (req, res) => {' },
    { name: 'ownerGetBookings', match: /router\.get\(\s*\"\/owner\"\,\s*authenticate\,\s*authorize\(\[\"owner\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.ownerGetBookings = async (req, res) => {' },
    { name: 'ownerUpdateBooking', match: /router\.patch\(\s*\"\/owner\/:booking_id\"\,\s*authenticate\,\s*authorize\(\[\"owner\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.ownerUpdateBooking = async (req, res) => {' },
    { name: 'studentGetBookings', match: /router\.get\(\s*\"\/my\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.studentGetBookings = async (req, res) => {' },
    { name: 'studentLeaveRoom', match: /router\.patch\(\s*\"\/leave\/:booking_id\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.studentLeaveRoom = async (req, res) => {' },
    { name: 'studentCancelBooking', match: /router\.patch\(\s*\"\/cancel\/:booking_id\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.studentCancelBooking = async (req, res) => {' },
    { name: 'bookWithRoommate', match: /router\.post\(\s*\"\/book-with-roommate\/:property_id\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.bookWithRoommate = async (req, res) => {' },
    { name: 'confirmRoommate', match: /router\.patch\(\s*\"\/confirm-roommate\/:booking_id\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.confirmRoommate = async (req, res) => {' },
    { name: 'getPendingRoommateInvites', match: /router\.get\(\s*\"\/pending-roommate-invites\"\,\s*authenticate\,\s*authorize\(\[\"student\"\]\)\,\s*async\s*\(req\,\s*res\)\s*=>\s*\{/, replace: 'exports.getPendingRoommateInvites = async (req, res) => {' },
    { name: 'getRoomShares', match: /router\.get\('\/room-shares',\s*authenticate,\s*authorize\(\['student'\]\),\s*async\s*\(req,\s*res\)\s*=>\s*\{/, replace: 'exports.getRoomShares = async (req, res) => {' },
    { name: 'requestJoin', match: /router\.post\('\/request-join\/:booking_id',\s*authenticate,\s*authorize\(\['student'\]\),\s*async\s*\(req,\s*res\)\s*=>\s*\{/, replace: 'exports.requestJoin = async (req, res) => {' },
    { name: 'respondJoin', match: /router\.patch\('\/respond-join\/:booking_id\/:request_id',\s*authenticate,\s*authorize\(\['student'\]\),\s*async\s*\(req,\s*res\)\s*=>\s*\{/, replace: 'exports.respondJoin = async (req, res) => {' },
    { name: 'getPendingJoinRequests', match: /router\.get\('\/pending-join-requests',\s*authenticate,\s*authorize\(\['student'\]\),\s*async\s*\(req,\s*res\)\s*=>\s*\{/, replace: 'exports.getPendingJoinRequests = async (req, res) => {' }
];

let controllerCode = code;

controllerCode = controllerCode.replace('const express = require("express");', '');
controllerCode = controllerCode.replace('const mongoose = require("mongoose");', 'const mongoose = require("mongoose");\n// Ex-router dependencies moved down');
controllerCode = controllerCode.replace('const { authenticate, authorize } = require("../middleware/authMiddleware");', '');
controllerCode = controllerCode.replace('const router = express.Router();', '');
controllerCode = controllerCode.replace('module.exports = router;', '');

console.log('After header imports:', controllerCode.length);

replacements.forEach(({ name, match, replace }) => {
    const lenBefore = controllerCode.length;
    controllerCode = controllerCode.replace(match, replace);
    const matched = controllerCode.length !== lenBefore;
    console.log(`Replacement ${name}: ${matched ? 'Matched!' : 'Missed.'} -> New Length: ${controllerCode.length}`);
});

controllerCode = controllerCode.replace(/^  \}\n\);/gm, '  }');
console.log('After 1st trailing cleanup:', controllerCode.length);
controllerCode = controllerCode.replace(/^\}\n\);/gm, '}');
console.log('After 2nd trailing cleanup:', controllerCode.length);
controllerCode = controllerCode.replace(/^    \}\n\);/gm, '    }');
console.log('Final length:', controllerCode.length);

fs.writeFileSync('debug.txt', controllerCode);
