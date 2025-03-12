const express = require("express");
const Review = require("../models/Review");
const { isAuthenticated } = require("../middlewares/userauth");
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReviewById,
  totalReviews,
} = require("../controller/Reviews");
const { checkReviewOwner } = require("../middlewares/checkReviw");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: API for managing reviews
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     description: Retrieve a list of all reviews.
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/", getAllReviews);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Reviews]
 *     description: Retrieve a single review by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 */
router.get("/:id", getReviewById);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     description: Authenticated users can add a review.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotelId:
 *                 type: string
 *                 example: "65ab123e8f0d3c3b5e5f4f1a"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Great experience!"
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 */
router.post("/", isAuthenticated, createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Update a review
 *     tags: [Reviews]
 *     description: Only the review owner or an admin can update a review.
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Good service!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only the owner or an admin can update
 *       404:
 *         description: Review not found
 */
router.patch("/:id", isAuthenticated, checkReviewOwner, updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     description: Only the review owner or an admin can delete a review.
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
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only the owner or an admin can delete
 *       404:
 *         description: Review not found
 */
router.delete("/:id", isAuthenticated, checkReviewOwner, deleteReviewById);

/**
 * @swagger
 * /reviews/hotel/{hotelId}/rating:
 *   get:
 *     summary: Get average rating for a hotel
 *     tags: [Reviews]
 *     description: Retrieve the average rating of a specific hotel.
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully
 *       404:
 *         description: Hotel not found or no reviews available
 */
// router.get("/hotel/:hotelId/rating", totalReviews);

module.exports = router;
