const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeHost, authorizeAdminOrHost } = require("../middlewares/authrization");
const {
  deleteBooking,
  createBooking,
  getAllBookings,
  getBookingsInRange,
  getBookingById,
  updatePropertyDates,
  confirmBooking,
  cancelBooking,
  cancelPropertyInBooking,
  confirmPropertyInBooking,
  getBookingsByHost,
  getBookingsByUser,
  filterBookingsByStatus,
  getBookedDatesForProperty,
  getAvailablePropertiesForDate,
  getAvailablePropertiesForDateRange,
  checkPropertyAvailability,
  calculateAirbnbRevenue,
  calculateHostRevenue,
  getPaymentIdByBookingId,
} = require("../controller/Booking/Booking");

/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: API for managing hotel bookings
 */

/**
 * @swagger
 * /bookings:
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
router.get("/", [isAuthenticated, authorizeAdminOrHost], getAllBookings);
/**
 * @swagger
 * /bookings/properties/{propertyId}/booked-dates:
 *   get:
 *     summary: Get all booked dates for a specific property
 *     tags: [Bookings]
 *     description: Retrieve all booked dates for a specific property.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: List of booked dates for the property
 *       404:
 *         description: Property not found
 */
router.get("/properties/:propertyId/booked-dates", getBookedDatesForProperty);
/**
 * @swagger
 * /bookings:
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
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     propertyId:
 *                       type: string
 *                       example: "65ab123e8f0d3c3b5e5f4f1a"
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-04-10"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-04-15"
 *                     price:
 *                       type: number
 *                       example: 400
 *                     companions:
 *                       type: number
 *                       example: 2
 *                     petsAllowed:
 *                       type: boolean
 *                       example: false
 *                     paymentStatus:
 *                       type: string
 *                       enum: ["pending", "paid", "failed"]
 *                       example: "pending"
 *                     totalPrice:
 *                       type: number
 *                       example: 800
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
 * /bookings/range:
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
 * /bookings/user:
 *   get:
 *     summary: Get all bookings for a user
 *     tags: [Bookings]
 *     description: Users can retrieve all their bookings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for the user
 */
router.get("/user", isAuthenticated, getBookingsByUser);
/**
 * @swagger
 * /bookings/getAirbnbRevenue:
 *   get:
 *     summary: Get total Airbnb revenue (14% of completed bookings)
 *     tags: [Bookings]
 *     description: Returns the total revenue that Airbnb earns (14% cut) from all completed bookings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved Airbnb revenue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 1400.00
 *                   description: Total revenue after applying Airbnb's 14% cut
 *       500:
 *         description: Internal server error
 */
router.get("/getAirbnbRevenue", [isAuthenticated, authorizeAdmin], calculateAirbnbRevenue);
/**
 * @swagger
 * /bookings/getHostRevenue:
 *   get:
 *     summary: Calculate total revenue for the authenticated host including Airbnb cut
 *     tags: [Bookings]
 *     description: Returns the total confirmed booking revenue and the actual amount the host receives after Airbnb's 14% fee.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host revenue details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 5000.00
 *                   description: Total raw revenue from confirmed bookings
 *                 hostRevenue:
 *                   type: number
 *                   example: 4300.00
 *                   description: Revenue after Airbnb's 14% cut
 *                 airbnbCutPercentage:
 *                   type: string
 *                   example: "14%"
 *                   description: The percentage taken by Airbnb
 *       500:
 *         description: Server error
 */
router.get("/getHostRevenue", [isAuthenticated, authorizeHost], calculateHostRevenue);
router.get("/getPaymentIdByBookingId", isAuthenticated, getPaymentIdByBookingId);

/**
 * @swagger
 * /bookings/{id}:
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
 * /bookings/{id}/properties/{propertyId}/dates:
 *   patch:
 *     summary: Update dates for a specific property in a booking
 *     tags: [Bookings]
 *     description: Authenticated users can update the dates of a specific property in their booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ce123e8f0d3c3b5e5f4f1d"
 *       - in: path
 *         name: propertyId
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
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-07"
 *     responses:
 *       200:
 *         description: Property dates updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       404:
 *         description: Booking or property not found
 */
router.patch("/:id/properties/:propertyId/dates", isAuthenticated, updatePropertyDates);

/**
 * @swagger
 * /bookings/{id}:
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
 * /bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a booking
 *     tags: [Bookings]
 *     description: Only hosts can confirm a booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65d0123e8f0d3c3b5e5f4f1f"
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       403:
 *         description: Forbidden - Only hosts can confirm bookings
 *       404:
 *         description: Booking not found
 */
router.patch("/:id/confirm", [isAuthenticated, authorizeHost], confirmBooking);

/**
 * @swagger
 * /bookings/{id}/properties/{propertyId}/cancel:
 *   patch:
 *     summary: Cancel a specific property in a booking
 *     tags: [Bookings]
 *     description: Users can cancel a specific property in their booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65d0123e8f0d3c3b5e5f4f1f"
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Property cancelled successfully
 *       404:
 *         description: Booking or property not found
 */
router.patch("/:id/properties/:propertyId/cancel", isAuthenticated, cancelPropertyInBooking);

/**
 * @swagger
 * /bookings/{id}/properties/{propertyId}/confirm:
 *   patch:
 *     summary: Confirm a specific property in a booking
 *     tags: [Bookings]
 *     description: Hosts can confirm a specific property in a booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65d0123e8f0d3c3b5e5f4f1f"
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Property confirmed successfully
 *       403:
 *         description: Forbidden - Only hosts can confirm properties
 *       404:
 *         description: Booking or property not found
 */
router.patch("/:id/properties/:propertyId/confirm", [isAuthenticated, authorizeHost], confirmPropertyInBooking);

/**
 * @swagger
 * /bookings/host:
 *   get:
 *     summary: Get all bookings for a host
 *     tags: [Bookings]
 *     description: Hosts can retrieve all bookings related to their properties.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for the host
 */
router.get("/host", [isAuthenticated, authorizeHost], getBookingsByHost);


/**
 * @swagger
 * /bookings/host/revenue:
 *   get:
 *     summary: Calculate total revenue for a host
 *     tags: [Bookings]
 *     description: Hosts can calculate their total revenue from paid bookings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total revenue for the host
 */
router.get("/host/revenue", [isAuthenticated, authorizeHost], calculateHostRevenue);

/**
 * @swagger
 * /bookings/filter:
 *   get:
 *     summary: Filter bookings by status
 *     tags: [Bookings]
 *     description: Admin can filter bookings by status (e.g., pending, confirmed).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["pending", "confirmed", "cancelled", "completed"]
 *         example: "confirmed"
 *     responses:
 *       200:
 *         description: List of filtered bookings
 */
router.get("/filter", [isAuthenticated, authorizeAdmin], filterBookingsByStatus);


/**
 * @swagger
 * /bookings/properties/available-range:
 *   get:
 *     summary: Get all available properties for a specific date range
 *     tags: [Bookings]
 *     description: Retrieve all properties that are available within a specific date range. If endDate is not provided, it defaults to the same day as startDate.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2023-11-15"
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2023-11-20"
 *     responses:
 *       200:
 *         description: List of available properties
 *       400:
 *         description: Invalid date or missing parameters
 */
router.get("/properties/available-range", checkPropertyAvailability);
module.exports = router;