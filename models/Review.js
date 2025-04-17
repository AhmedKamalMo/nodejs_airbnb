const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    HotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 300,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reviewSchema.pre("save", async function (next) {
  const existingReview = await mongoose.model("Review").findOne({
    bookingId: this.bookingId,
    userId: this.userId,
  });

  if (existingReview) {
    return next(new Error("You have already reviewed this booking"));
  }

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;