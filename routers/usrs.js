const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const usersModel = require("../models/users");
const Registration = require("../controller/user/Registration");
const Login = require("../controller/user/login");
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin } = require("../middlewares/authrization");

const {
  deleteUserById,
  getAllUser,
  getUserById,
  editUserById,
  addWishlist,
  getWishlist,
} = require("../controller/admin/user");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: API for managing users
 */
/**
 * @swagger
 * /users/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Users]
 *     description: Retrieve the user's wishlist.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           
 *     responses:
 *       201:
 *         description: get wishlist successfully
 *       400:
 *         description: Bad request - Invalid input data
 */
router.get("/wishlist", isAuthenticated, getWishlist);
/**
 * @swagger
 * /users/wishlist:
 *   post:
 *     summary: Add hotel to wishlist
 *     tags: [Users]
 *     description: Add a hotel to the user's wishlist.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             hotelId:
 *               type: string
 *               example: "65ab123e8f0d3c3b5e5f4f1a"
 *     responses:
 *       201:
 *         description: Hotel added to wishlist successfully
 *       400:
 *         description: Bad request - Invalid input data
 */
router.post("/wishlist", isAuthenticated, addWishlist);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Only admins can retrieve a list of all users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access
 */
router.get("/", [isAuthenticated, authorizeAdmin], getAllUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     description: Only admins can retrieve user details by ID.
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
 *         description: User details
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access
 */
router.get("/:id", [isAuthenticated, authorizeAdmin], getUserById);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     description: Register a new user in the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request - Invalid input data
 */
router.post("/register", Registration);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user details
 *     tags: [Users]
 *     description: Authenticated users can update their own details.
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
 *               username:
 *                 type: string
 *                 example: "updated_username"
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Only the owner or admin can edit
 */
router.patch("/:id", isAuthenticated, editUserById);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     description: Only admins can delete a user by ID.
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Only admins can delete
 */
router.delete("/:id", [isAuthenticated, authorizeAdmin], deleteUserById);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     description: Authenticate a user and generate a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "admin123!"
 *     responses:
 *       200:
 *         description: JWT token generated successfully
 *       400:
 *         description: Bad request - Invalid credentials
 */
router.post("/login", Login);
router.delete("/wishlist/:hotelId", isAuthenticated, async (req, res) => {
  const { hotelId } = req.params;
  const userId = req.user._id; // Assuming you have the user ID in the request

  try {
    const updatedUser = await usersModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: hotelId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Hotel removed from wishlist", updatedUser });
  } catch (error) {
    console.error("Error removing hotel from wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
