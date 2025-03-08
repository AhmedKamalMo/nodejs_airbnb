// routes/reviewRoutes.js
const express = require("express");
const Review = require("../models/Review");
const { isAuthenticated } = require("../middlewares/userauth");

const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReviewById,
} = require("../controller/Reviews");
const { checkReviewOwner } = require("../middlewares/checkReviw");
const router = express.Router();

router.get("/", getAllReviews);

// 🟢 عرض تقييم واحد (متاح للجميع)
router.get("/:id", getReviewById);

// 🟡 إضافة تقييم (يجب أن يكون المستخدم مسجّل دخول)
router.post("/", isAuthenticated, createReview);

// 🔵 تعديل التقييم (يجب أن يكون مالك التقييم أو **مشرف**)
router.put("/:id", isAuthenticated, checkReviewOwner, updateReview);

// 🔴 حذف التقييم (يجب أن يكون مالك التقييم أو **مشرف**)
router.delete("/:id", isAuthenticated, checkReviewOwner, deleteReviewById);

module.exports = router;
