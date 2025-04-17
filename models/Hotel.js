const mongoose = require("mongoose");
const Amenity = require("./Amenity");

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
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  pricePerNight: {
    type: Number,
    required: [true, "Price per night is required"],
    min: [1, "Price per night must be at least 1"],
    max: [10000, "Price per night cannot exceed 10,000"],
  },
  address: {
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      minlength: [2, "Country name must be at least 2 characters"],
      maxlength: [50, "Country name cannot exceed 50 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City name must be at least 2 characters"],
      maxlength: [50, "City name cannot exceed 50 characters"],
    },
  },
  images: {
    type: [String],
    required: [true, "At least one image is required"],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "There must be at least one image",
    },
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, "Rating cannot be below 0"],
    max: [5, "Rating cannot exceed 5"],
  },
  amenities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Amenity",
    },
  ],
  reviews: [
    {
      reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    },
  ],
});

const Hotel = mongoose.model("Hotel", HotelSchema);

module.exports = Hotel;