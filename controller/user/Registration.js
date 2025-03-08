const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");
const Registration = async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, address } = req.body;

    if (!firstName || !lastName || !email || !password || !dateOfBirth || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await usersModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new usersModel(req.body);
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = Registration;
