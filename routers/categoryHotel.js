const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin } = require("../middlewares/authrization");

const {
  add_category,
  getcategory,
  updatecategory,
  Deletecategory,
} = require("../controller/categoryHotel");

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all hotel categories
 *     description: Authenticated users can retrieve all hotel categories.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hotel categories
 */
router.get("/", isAuthenticated, getcategory);

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Add a new hotel category
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
 */
router.post("/", [isAuthenticated, authorizeAdmin], add_category);

/**
 * @swagger
 * /category/{id}:
 *   patch:
 *     summary: Update a hotel category
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
 */
router.patch("/:id", [isAuthenticated, authorizeAdmin], updatecategory);

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete a hotel category
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
 */
router.delete("/:id", [isAuthenticated, authorizeAdmin], Deletecategory);

module.exports = router;
