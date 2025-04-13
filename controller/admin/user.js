const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");
const mongoose = require('mongoose');
const getAllUser = async (req, res, next) => {
  try {
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

  try {
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
module.exports = {
  getAllUser,
  getUserById,

  editUserById,
  deleteUserById,
  addWishlist,
  getWishlist,
  removeFromWishlist
};
