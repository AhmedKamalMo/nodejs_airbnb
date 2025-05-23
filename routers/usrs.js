const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const router = express.Router();
const usersModel = require("../models/users");
// const Registration = require("../controller/user/Registration");
const Login = require("../controller/user/login");
const { isAuthenticated } = require("../middlewares/userauth");
const sendEmail = require('../utils/sendEmail');
const { authorizeAdmin, authorizeAdminOrHost } = require("../middlewares/authrization");
const { googleLogin, Registration } = require('../controller/user/Registration');



const {
  deleteUserById,
  getAllUser,
  getUserById,
  editUserById,
  addWishlist,
  getWishlist,
  removeFromWishlist,
  getUserProfile,
  forgotPassword,
  resetPassword
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
 * /users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Users]
 *     description: Authenticated users can fetch their own profile details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     phone:
 *                       type: string
 *                       example: "01012345678"
 *                     role:
 *                       type: string
 *                       example: "Guest"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.get("/profile", isAuthenticated, getUserProfile);
/**
 * @swagger
 * /users/wishlist:
 *   post:
 *     summary: Add hotel to wishlist
 *     tags: [Users]
 *     description: Add a hotel to the user's wishlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotelId:
 *                 type: string
 *                 example: "67fb72ca32bcebfaeb110b9d"
 *             required:
 *               - hotelId
 *     responses:
 *       200:
 *         description: Hotel added to wishlist successfully
 *       400:
 *         description: Bad request - Invalid input data
 *       404:
 *         description: User not found
 */
router.post("/wishlist", isAuthenticated, addWishlist);
/**
 * @swagger
 * /users/wishlist:
 *   delete:
 *     summary: Remove hotel from wishlist
 *     tags: [Users]
 *     description: Remove a hotel from the user's wishlist.
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
 *             required:
 *               - hotelId
 *     responses:
 *       200:
 *         description: Hotel removed from wishlist successfully
 *       400:
 *         description: Bad request - Invalid input data
 *       404:
 *         description: User not found
 */
router.delete("/wishlist", isAuthenticated, removeFromWishlist);

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     description: Send a password reset token to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /users/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Users]
 *     description: Reset user password using the token received via email
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @swagger
 * /users/phone-signin:
 *   post:
 *     summary: Request OTP via WhatsApp
 *     tags: [Users]
 *     description: Send OTP to user's WhatsApp number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *             required:
 *               - phone
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Server error
 */
router.post('/phone-signin', Login.requestOTP);

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: Verify OTP and get token
 *     tags: [Users]
 *     description: Verify the OTP sent to WhatsApp and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *             required:
 *               - phone
 *               - otp
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', Login.verifyOTP);

router.delete("/wishlist", isAuthenticated, removeFromWishlist);

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
router.get("/", [isAuthenticated, authorizeAdminOrHost], getAllUser);

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
router.get("/:id", [isAuthenticated, authorizeAdminOrHost], getUserById);

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
// ghada////
// router.post("/register", Registration);
router.post('/google', googleLogin);
router.post('/register', Registration);
///ghada/////
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
router.post("/login", Login.Login);

module.exports = router;
// getUserProfile
