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
} = require("../controller/admin/user");

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Only admins can retrieve a list of all users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", [isAuthenticated, authorizeAdmin], getAllUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
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
 */
router.get("/:id", [isAuthenticated, authorizeAdmin], getUserById);

/**
 * @swagger
 * /users/Registration:
 *   post:
 *     summary: Register a new user
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
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/Registration", Registration);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user details
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
 */
router.patch("/:id", isAuthenticated, editUserById);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
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
 */
router.delete("/:id", [isAuthenticated, authorizeAdmin], deleteUserById);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and generate a JWT token.
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
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       200:
 *         description: JWT token generated successfully
 */
router.post("/login", Login);

module.exports = router;
