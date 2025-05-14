const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");
const whatsappService = require('../../services/whatsapp');

// Store OTP codes temporarily (in production, use Redis or similar)
const otpStore = new Map();

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await usersModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

exports.requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
console.log(phone.length)
    if (!(phone.length == 11) ) {
      return res.status(400).json({ message: 'Invalid phone number', isError: true });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      code: otp,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send OTP via WhatsApp
    const whatsappSent = await whatsappService.sendOTP(phone, otp);

    if (!whatsappSent) {
      return res.status(500).json({
        message: 'Failed to send WhatsApp message. Make sure you have scanned the QR code and the WhatsApp client is ready.',
        isError: true
      });
    }

    res.json({
      message: 'OTP sent successfully via WhatsApp',
      isError: false
    });
  } catch (error) {
    console.error('Phone signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(phone);
    if (!storedOTP || storedOTP.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' , isError: true });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expiry) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired', isError: true });
    }

    // Find user by phone
    const user = await usersModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found', isError: true });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Clear used OTP
    otpStore.delete(phone);

    res.json({
      message: 'OTP verified successfully',
      token,
      isError: false
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
