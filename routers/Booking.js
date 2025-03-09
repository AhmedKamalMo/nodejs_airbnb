const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeHost } = require("../middlewares/authrization");
const {
  deleteBooking,
  createBooking,
  getAllBookings,
  getBookingsInRange,
  getBookingById,
  updateBooking,
  approveBooking,
} = require("../controller/Booking/Booking");

/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: API for managing hotel bookings
 */

/**
 * @swagger
 * /Booking:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     description: Admin can retrieve all bookings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only admins can retrieve all bookings
 */
router.get("/", [isAuthenticated, authorizeAdmin], getAllBookings);

/**
 * @swagger
 * /Booking:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     description: Authenticated users can create a booking.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65ab123e8f0d3c3b5e5f4f1a"
 *               hotelId:
 *                 type: string
 *                 example: "65cb456e8f0d3c3b5e5f4f1b"
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-04-10"
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-04-15"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - User must be authenticated
 */
router.post("/", isAuthenticated, createBooking);

/**
 * @swagger
 * /Booking/range:
 *   post:
 *     summary: Get bookings within a specific date range
 *     tags: [Bookings]
 *     description: Admin can retrieve all bookings within a given time range.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-10"
 *     responses:
 *       200:
 *         description: List of bookings in the specified range
 */
router.post("/range", [isAuthenticated, authorizeAdmin], getBookingsInRange);

/**
 * @swagger
 * /Booking/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     description: Authenticated users can retrieve details of a specific booking by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65cd789e8f0d3c3b5e5f4f1c"
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get("/:id", isAuthenticated, getBookingById);

/**
 * @swagger
 * /Booking/{id}:
 *   patch:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     description: Authenticated users can update their booking details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ce123e8f0d3c3b5e5f4f1d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-01"
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-07"
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       404:
 *         description: Booking not found
 */
router.patch("/:id", isAuthenticated, updateBooking);

/**
 * @swagger
 * /Booking/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     description: Users can delete their bookings, while admin can delete any booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65cf456e8f0d3c3b5e5f4f1e"
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", isAuthenticated, deleteBooking);

/**
 * @swagger
 * /Booking/{id}/approve:
 *   patch:
 *     summary: Approve or reject a booking
 *     tags: [Bookings]
 *     description: Only hosts can approve or reject a booking request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65d0123e8f0d3c3b5e5f4f1f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       403:
 *         description: Forbidden - Only hosts can approve bookings
 */
router.patch("/:id/approve", [isAuthenticated, authorizeHost], approveBooking);

module.exports = router;
