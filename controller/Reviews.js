const Hotel = require("../models/Hotel");
const Review = require("../models/Review"); // Import the Review model
const mongoose = require("mongoose");

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("userId", "name email");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("userId", "name email");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { bookingId, HotelId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }
    if (!mongoose.Types.ObjectId.isValid(HotelId)) {
      return res.status(400).json({ message: "Invalid HotelId format" });
    }

    const reviewData = {
      bookingId: bookingId,
      HotelId: HotelId,
      userId: req.user._id,
      rating,
      comment,
    };

    const review = new Review(reviewData);
    await review.save();
    const hotel = await Hotel.findById(HotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    hotel.reviews.push({ reviewId: review._id });
    await hotel.save();

    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReviewById = async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }


};
exports.bookingReviewById = async (req, res) => {
  try {
    const reviews = await Review.find({ bookingId: req.params.id });
    if (!reviews) {
      return res.status(404).json({ message: "No reviews found for this booking." });
    }
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}