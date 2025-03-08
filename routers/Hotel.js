const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");

// Middleware for authorization



const {
  addHotel,
  DeleteHotel,
  GetallHotel,
  GetHotelById,
  UpdateByID,
  searchHotelByName,
  searchHotelByAddress,
} = require("../controller/Hotel");
const { authorizeAdmin, authorizeHost } = require("../middlewares/authrization");

// Routes
router.get("/", GetallHotel); // Get all hotels (public)
router.post("/search", searchHotelByName); // Search hotels by name (public)
router.post("/address", searchHotelByAddress); // Search hotels by address (public)

router.get("/:id", GetHotelById); // Get hotel by ID (public)

router.post("/add", [isAuthenticated, authorizeHost], addHotel); // Add a new hotel (hosts only)
router.patch("/:id", [isAuthenticated, authorizeHost], UpdateByID); // Update hotel by ID (hotel owner only)
router.delete("/:id", [isAuthenticated, authorizeAdmin], DeleteHotel); // Delete hotel by ID (admin only)

module.exports = router;
