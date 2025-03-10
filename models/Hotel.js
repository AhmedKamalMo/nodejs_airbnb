const mongoose = require("mongoose");

const HotelSchema = mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters"],
  },
  pricePerNight: {
    type: Number,
    required: [true, "Price per night is required"],
    min: [1, "Price per night must be at least 1"],
  },
  address: {
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      minlength: [2, "Country name must be at least 2 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City name must be at least 2 characters"],
    },
  },
  images: {
    type: [String],
    required: [true, "At least one image is required"],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: "There must be at least one image",
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, "Rating cannot be below 0"],
    max: [5, "Rating cannot exceed 5"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  categories: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
  },
  status: {
    type: String,
    enum: ["available", "booked", "unavailable", "maintenance"],
    default: "available",
    required: [true, "Status is required"],
  },
  path: {
    type: String,
    unique: true,
    required: [true, "Path is required"],
    trim: true,
  },
  rooms: {
    type: Number,
    required: [true, "Number of rooms is required"],
    min: [1, "A hotel must have at least one room"],
  },
});

const Hotel = mongoose.model("Hotel", HotelSchema);

module.exports = Hotel;
