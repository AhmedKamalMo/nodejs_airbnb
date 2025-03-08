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

// Routes
router.get("/",[isAuthenticated, authorizeAdmin], getAllUser); // Get all users
router.get("/:id",[isAuthenticated, authorizeAdmin], getUserById); // Get user by ID
router.post("/Registration", Registration); // Register a new user

router.patch("/:id", isAuthenticated, editUserById); // Update user by ID
router.delete("/:id",[isAuthenticated, authorizeAdmin] , deleteUserById); // Delete user by ID

router.post("/login", Login); // Authenticate a user and generate a JWT token

module.exports = router;