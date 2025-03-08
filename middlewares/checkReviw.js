const jwt = require("jsonwebtoken");
const Review = require("../models/Review");

////////////////////////////////ده خاص بال login
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.userId;
    next();
  });
};
///////////////////////////////////////////////////////////////////////////////

//ده خاص بالمستخدم نفسه بحيث يكون هو فقط اللي يقدر يسمح او يعدل الرفيو الخاص به
const checkReviewOwner = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم مسجل دخول
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized, please login" });
    }

    // البحث عن التقييم باستخدام الـ ID
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // التحقق من أن المستخدم الحالي هو صاحب التقييم
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to modify or delete this review",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { checkReviewOwner };


module.exports = { authenticate, checkReviewOwner };
