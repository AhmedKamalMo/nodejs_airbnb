const express = require("express");
const Review = require("../models/Review");
const { isAuthenticated } = require("../middlewares/userauth");
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReviewById,
} = require("../controller/Reviews");
const { checkReviewOwner } = require("../middlewares/checkReviw");
const router = express.Router();

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all reviews
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
 */
router.get("/:id", getReviewById);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
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
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Great experience!"
 *     responses:
 *       201:
 *         description: Review added successfully
 */
router.post("/", isAuthenticated, createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review
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
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Good service!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put("/:id", isAuthenticated, checkReviewOwner, updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
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
 */
router.delete("/:id", isAuthenticated, checkReviewOwner, deleteReviewById);

module.exports = router;
