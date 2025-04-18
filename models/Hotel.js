const mongoose = require("mongoose");
const Amenity = require("./Amenity");

const HotelSchema = mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Host ID is required"],
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
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
  aboutThisSpace: {
    type: String,
    required: false,
    trim: true,
    minlength: [10, "About this space must be at least 10 characters"],
    maxlength: [1000, "About this space cannot exceed 1000 characters"],
  },
  address: {
    fullAddress: {
      type: String,
      required: [false],
      trim: true,
      minlength: [5, "Full address must be at least 5 characters"],
      maxlength: [200, "Full address cannot exceed 200 characters"],
    },
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
    coordinates: {
      type: [Number],// [longitude, latitude]
      required: false,
      validate: {
        validator: function (v) {
          return v === undefined || Array.isArray(v) && v.length === 2;
        },
        message: "Coordinates must be an array of [longitude, latitude]",
      },
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

  status: {
    type: String,
    enum: ["available", "booked", "unavailable", "maintenance"],
    default: "available",
    required: [true, "Status is required"],
  },
  spaceDetails: {
    bedrooms: {
      type: Number,
      required: [true, "Number of bedrooms is required"],
      min: [1, "A hotel must have at least one bedroom"],
      max: [5, "A hotel cannot have more than 5 bedrooms"],
    },
    path: {
      type: Number,
      required: [true, "Number of bathrooms is required"],
      min: [1, "A hotel must have at least one bathroom"],
      max: [5, "A hotel cannot have more than 5 bathrooms"],
    },
    beds: {
      type: Number,
      required: [true, "Number of beds is required"],
      min: [1, "There must be at least one bed"],
      max: [10, "Cannot have more than 10 beds"],
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: [10, "Area must be at least 10 square meters"],
    },
    rooms: {
      type: Number,
      required: [true, "Number of rooms is required"],
      min: [1, "A hotel must have at least one room"],
      max: [10, "A hotel cannot have more than 10 rooms"],
    }
  },
  capacity: {
    adults: {
      type: Number,
      required: [true, "Number of adults is required"],
      min: [1, "A hotel must accommodate at least one adult"],
      max: [10, "A hotel cannot accommodate more than 10 adults"],
    },
    children: {
      type: Number,
      required: [true, "Number of children is required"],
      min: [0, "Number of children cannot be below 0"],
      max: [5, "A hotel cannot accommodate more than 5 children"],
    },
    infants: {
      type: Number,
      required: [true, "Number of infants is required"],
      min: [0, "Number of infants cannot be below 0"],
      max: [3, "A hotel cannot accommodate more than 3 infants"],
    },
  },
  petPolicy: {
    type: String,
    enum: ["allowed", "not_allowed", "on_request"],
    default: "not_allowed",
  },
  view: {
    type: String,
    enum: ["ocean", "mountain", "city", "garden", "none"],
    default: "none",
  },
  advantages: {
    type: [String],
    required: [true, "Advantages are required"],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "There must be at least one advantage",
    },
    default: [],
  },
  cancellationPolicy: {
    type: String,
    enum: ["flexible", "moderate", "strict"],
    default: "flexible",
    required: [true, "Cancellation policy is required"],
  },
  propertyType: {
    type: String,
    enum: ["apartment", "villa", "house", "private_room", "shared_room"],
    default: "apartment",
    required: [true, "Property type is required"],
  },
  safetyFeatures: {
    smokeDetector: {
      type: Boolean,
      default: false,
    },
    carbonMonoxideDetector: {
      type: Boolean,
      default: false,
    },
    firstAidKit: {
      type: Boolean,
      default: false,
    },
    fireExtinguisher: {
      type: Boolean,
      default: false,
    },
  },
  houseRules: {
    type: [String],
    required: false,
    validate: {
      validator: function (v) {
        return Array.isArray(v);
      },
      message: "House rules must be an array of strings",
    },
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Hotel = mongoose.model("Hotel", HotelSchema);

module.exports = Hotel;