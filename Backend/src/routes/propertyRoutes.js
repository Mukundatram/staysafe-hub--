const express = require("express");
const propertyController = require("../controllers/propertyController");
const router = express.Router();

/* ================= GET ALL PROPERTIES WITH ADVANCED FILTERING ================= */
router.get("/", propertyController.getAllProperties);

/* ================= GET PROPERTY BY ID ================= */
router.get("/:id", propertyController.getPropertyById);

module.exports = router;
