const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");
const mongoose = require('mongoose');
const { request } = require("express");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");
const getAllUser = async (req, res, next) => {
  try {
    if (req.user.role === "Host") {
      res.status(200).json([]);
    }
    const users = await usersModel.find();
    res.status(200).json(users);
  } catch (err) {
    next({ message: "Failed to retrieve users", error: err.message });
  }
};

const getUserById = async (req, res, next) => {
  const { id } = req.params;
  console.log("id", id);

  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await usersModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Success", user });
  } catch (err) {
    next({ message: "Failed to retrieve user", error: err.message });
  }
};

const editUserById = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const userId = req.user._id;

  try {
    if (id !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this user" });
    }
    const updatedUser = await usersModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Success", user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    next(500).json({ message: "Failed to update user", error: err.message });
  }
};
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await usersModel.findById(userId).select("-password -googleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Success", user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    next(err);
  }
};
const deleteUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await usersModel.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next({ message: "Failed to delete user", error: err.message });
  }
};

const addWishlist = async (req, res, next) => {
  const { hotelId } = req.body;
  const id = req.user._id;

  // التحقق من وجود hotelId
  if (!hotelId) {
    return res.status(400).json({ message: "Hotel ID is required" });
  }

  // التحقق من أن hotelId هو ObjectId صالح
  // if (!mongoose.Types.ObjectId.isValid(hotelId)) {
  //   return res.status(400).json({ message: "Invalid Hotel ID" });
  // }

  try {
    // تحديث قائمة الأمنيات باستخدام $addToSet
    const user = await usersModel.findByIdAndUpdate(
      id,
      { $addToSet: { wishlist: hotelId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Hotel added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    next(new Error("Failed to add hotel to wishlist"));
  }
};

const getWishlist = async (req, res, next) => {
  const id = req.user._id;

  try {
    // الحصول على قائمة الأمنيات مع Populate
    const user = await usersModel.findById(id).populate("wishlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Success", wishlist: user.wishlist });
  } catch (err) {
    next(new Error("Failed to get wishlist"));
  }
};


const removeFromWishlist = async (req, res, next) => {
  const { hotelId } = req.body;
  const id = req.user._id;

  if (!hotelId || hotelId.trim() === "") {
    return res.status(400).json({ message: "Hotel ID is required" });
  }


  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Invalid Hotel ID" });
  }

  try {
    const user = await usersModel.findByIdAndUpdate(
      id,
      { $pull: { wishlist: new mongoose.Types.ObjectId(hotelId) } },
      { new: true }
    );

    console.log("Updated User:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Hotel removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (err) {
    console.error("Error removing hotel from wishlist:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await usersModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Save hashed token to user
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/users/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please use this token to reset your password: ${resetToken}\n\nTo reset your password, make a POST request to: ${resetUrl}\n\nWith the following JSON body:\n{\n  "password": "your-new-password"\n}\n\nThis token will expire in 1 hour.`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
}
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await usersModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
module.exports = {
  getAllUser,
  getUserById,
  removeFromWishlist,
  getUserProfile,
  editUserById,
  deleteUserById,
  addWishlist,
  getWishlist,
  removeFromWishlist,
  forgotPassword,
  resetPassword
};
