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
  updateStatus,
  searchHotelByCategory,
  searchHotelByPrice,
  filterAll,
  getHostHotels,
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
 * /Hotel/hostHotel:
 *   get:
 *     summary: Get hotels for the authenticated host
 *     tags: [Hotels]
 *     description: Retrieve a list of hotels owned by the authenticated host.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hotels owned by the host
 */
router.get("/hostHotel", [isAuthenticated, authorizeHost], getHostHotels);
/**
 * @swagger
 * /Hotel/flitter:
 *   get:
 *     summary: Filter hotels based on various criteria
 *     tags: [Hotels]
 *     description: Search and filter hotels using query parameters such as price range, city, status, category, ratings, amenities, guests, pets, and sorting.
 *     parameters:
 *       - in: query
 *         name: rooms
 *         schema:
 *           type: number
 *         description: Filter hotels by the number of rooms.
 *       - in: query
 *         name: path
 *         schema:
 *           type: number
 *         description: Filter hotels by the number of bathrooms.
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night for filtering hotels.
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night for filtering hotels.
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter hotels by city (case-insensitive).
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter hotels by status (e.g., available, booked, unavailable, maintenance).
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter hotels by category ID.
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Filter hotels by minimum rating (e.g., 4 for 4 stars or higher).
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Filter hotels by amenities (comma-separated list of amenity IDs). Hotels must have all specified amenities.
 *       - in: query
 *         name: adults
 *         schema:
 *           type: number
 *         description: Filter hotels by the minimum number of adults they can accommodate.
 *       - in: query
 *         name: children
 *         schema:
 *           type: number
 *         description: Filter hotels by the minimum number of children they can accommodate.
 *       - in: query
 *         name: infants
 *         schema:
 *           type: number
 *         description: Filter hotels by the minimum number of infants they can accommodate.
 *       - in: query
 *         name: pets
 *         schema:
 *           type: number
 *         description: Filter hotels by the minimum number of pets they allow.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter hotels by availability starting from this date (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter hotels by availability ending on this date (YYYY-MM-DD).
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort the results by (e.g., createdAt, pricePerNight).
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending).
 *     responses:
 *       200:
 *         description: List of matching hotels.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Bad request - Invalid input
 *       500:
 *         description: Server error
 */
router.get("/flitter", filterAll);
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
 * /Hotel/search/category:
 *   post:
 *     summary: Search hotels by catogory
 *     tags: [Hotels]
 *     description: Search for hotels based on catogory.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: List of matching hotels
 *       400:
 *         description: Bad request - Invalid input
 */
router.post("/search/category", searchHotelByCategory);

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
router.post("/", [isAuthenticated, authorizeAdmin], addHotel);

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
router.patch("/:id", [isAuthenticated, authorizeAdmin], UpdateByID);

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
/**
 * @swagger
 * /Hotel/status/{id}:
 *   patch:
 *     summary: Update the status of a hotel
 *     tags: [Hotels]
 *     description: Only hosts and admins can update the status of a hotel.
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
 *               status:
 *                 type: string
 *                 enum: [available, booked, unavailable, maintenance]
 *                 example: "maintenance"
 *     responses:
 *       200:
 *         description: Hotel status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Hotel not found
 */

router.patch("/status/:id", [isAuthenticated, authorizeAdmin], updateStatus);



module.exports = router;
