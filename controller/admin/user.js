const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");

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

const addWishlist = async (req, res) => {
  const { hotelId } = req.body;
  const id = req.user._id;


  try {
    const user = await usersModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.wishlist.includes(hotelId)) {
      user.wishlist.push(hotelId);
      await user.save();
    }

    res.status(200).json({ message: "Hotel added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    next({ message: "Failed to add hotel to wishlist", error: err.message });
  }
};
const getWishlist = async (req, res) => {
  const id = req.user._id;

  try {
    const user = await usersModel.findById(id).populate("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.wishlist.length === 0) {
      return res.status(200).json({ message: "Wishlist is empty", wishlist: [] });
    }
    res.status(200).json({ message: "Success", wishlist: user.wishlist });


  } catch (err) {
    next({ message: "Failed to get  wishlist", error: err.message });
  }
};
module.exports = {
  getAllUser,
  getUserById,

  editUserById,
  deleteUserById,
  addWishlist,
  getWishlist
};
