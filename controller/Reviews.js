const Review = require("../models/Review"); // Import the Review model

// 🟢 جلب جميع التقييمات
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("userId", "name email");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 جلب تقييم واحد عبر الـ ID
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

// 🟡 إنشاء تقييم جديد
exports.createReview = async (req, res) => {
  const { rating, comment, HotelId } = req.body;
  const userId = req.user._id; // أخذ المستخدم من التوكن

  try {
    const newReview = new Review({
      rating,
      comment,
      HotelId,
      userId,
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🔵 تحديث تقييم
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

// 🔴 حذف تقييم
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
