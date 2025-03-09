const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeHost } = require("../middlewares/authrization");

const {
  addHotel,
  DeleteHotel,
  GetallHotel,
  GetHotelById,
  UpdateByID,
  searchHotelByName,
  searchHotelByAddress,
} = require("../controller/Hotel");

/**
 * @swagger
 * tags:
 *   - name: Hotels
 *     description: API for managing hotels
 */

/**
 * @swagger
 * /Hotel:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     description: Retrieve a list of all hotels.
 *     responses:
 *       200:
 *         description: List of hotels
 */
router.get("/", GetallHotel);

/**
 * @swagger
 * /Hotel/search:
 *   post:
 *     summary: Search hotels by name
 *     tags: [Hotels]
 *     description: Search for hotels based on name.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hilton"
 *     responses:
 *       200:
 *         description: List of matching hotels
 *       400:
 *         description: Bad request - Invalid input
 */
router.post("/search", searchHotelByName);

/**
 * @swagger
 * /Hotel/search/address:
 *   post:
 *     summary: Search hotels by address
 *     tags: [Hotels]
 *     description: Search for hotels based on address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 example: "New York"
 *     responses:
 *       200:
 *         description: List of matching hotels
 *       400:
 *         description: Bad request - Invalid input
 */
router.post("/search/address", searchHotelByAddress);

/**
 * @swagger
 * /Hotel/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
 *     description: Retrieve hotel details by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Hotel details
 *       404:
 *         description: Hotel not found
 */
router.get("/:id", GetHotelById);

/**
 * @swagger
 * /Hotel:
 *   post:
 *     summary: Add a new hotel
 *     tags: [Hotels]
 *     description: Only hosts can add a new hotel.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Marriott"
 *               address:
 *                 type: string
 *                 example: "Los Angeles, CA"
 *     responses:
 *       201:
 *         description: Hotel added successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only hosts can add a hotel
 */
router.post("/", [isAuthenticated, authorizeHost], addHotel);

/**
 * @swagger
 * /Hotel/{id}:
 *   patch:
 *     summary: Update hotel details
 *     tags: [Hotels]
 *     description: Only the hotel owner can update hotel details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Hotel Name"
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only the owner can update
 *       404:
 *         description: Hotel not found
 */
router.patch("/:id", [isAuthenticated, authorizeHost], UpdateByID);

/**
 * @swagger
 * /Hotel/{id}:
 *   delete:
 *     summary: Delete a hotel
 *     tags: [Hotels]
 *     description: Only admins can delete a hotel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only admins can delete
 *       404:
 *         description: Hotel not found
 */
router.delete("/:id", [isAuthenticated, authorizeAdmin], DeleteHotel);

module.exports = router;
