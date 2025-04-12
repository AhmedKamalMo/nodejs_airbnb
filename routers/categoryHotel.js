const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeHost } = require("../middlewares/authrization");

const {
  add_category,
  getcategory,
  updatecategory,
  Deletecategory,
} = require("../controller/categoryHotel");
const { updateStatus } = require("../controller/Hotel");

/**
 * @swagger
 * tags:
 *   - name: Hotel Categories
 *     description: API for managing hotel categories
 */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all hotel categories
 *     tags: [Hotel Categories]
 *     description: Authenticated users can retrieve all hotel categories.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hotel categories
 *       401:
 *         description: Unauthorized - User must be authenticated
 */
router.get("/", getcategory);

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Add a new hotel category
 *     tags: [Hotel Categories]
 *     description: Only admins can add a new category.
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
 *                 example: "Luxury Hotels"
 *     responses:
 *       201:
 *         description: Category added successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only admins can add categories
 */
router.post("/", [isAuthenticated, authorizeAdmin], add_category);

/**
 * @swagger
 * /category/{id}:
 *   patch:
 *     summary: Update a hotel category
 *     tags: [Hotel Categories]
 *     description: Only admins can update an existing category.
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
 *                 example: "Budget Hotels"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only admins can update categories
 *       404:
 *         description: Category not found
 */
router.patch("/:id", [isAuthenticated, authorizeAdmin], updatecategory);

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete a hotel category
 *     tags: [Hotel Categories]
 *     description: Only admins can delete a category.
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
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized - User must be authenticated
 *       403:
 *         description: Forbidden - Only admins can delete categories
 *       404:
 *         description: Category not found
 */
router.delete("/:id", [isAuthenticated, authorizeAdmin], Deletecategory);

module.exports = router;
