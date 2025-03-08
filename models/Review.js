const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 300,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ✅ جعل userId مطلوبًا
    },
    HotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true, // ✅ جعل HotelId مطلوبًا
    },
  },
  { timestamps: true } // ✅ Mongoose سيُضيف `createdAt` و `updatedAt` تلقائيًا
);

// ✅ تحديث `updatedAt` تلقائيًا عند التعديل
reviewSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
