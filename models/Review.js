const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
    },
    HotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel reference is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reviewSchema.pre("save", async function (next) {
  const Booking = mongoose.model("Booking");
  const Review = mongoose.model("Review");

  const booking = await Booking.findById(this.bookingId);
  if (!booking) {
    return next(new Error("Invalid booking reference"));
  }

  if (new Date(booking.checkOutDate) > new Date()) {
    return next(new Error("You can only review after the check-out date"));
  }

  const existingReview = await Review.findOne({
    bookingId: this.bookingId,
    userId: this.userId,
  });

  if (existingReview && this.isNew) {
    return next(new Error("You have already reviewed this booking"));
  }

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;