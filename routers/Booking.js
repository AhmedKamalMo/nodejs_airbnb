const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeHost } = require("../middlewares/authrization");

const {
  deleteBooking,
  createBooking,
  getAllBookings,
  getBookingsInRange,
  getBookingById,
  updateBooking,
  approveBooking,
} = require("../controller/Booking/Booking");

// الحصول على جميع الحجوزات (للأدمن فقط)
router.get("/getall", [isAuthenticated, authorizeAdmin], getAllBookings);

// إنشاء حجز (للمستخدم المصادق عليه فقط)
router.post("/create", isAuthenticated, createBooking);

// الحصول على الحجوزات في نطاق زمني معين (الأدمن فقط)
router.post("/range", [isAuthenticated, authorizeAdmin], getBookingsInRange);

// الحصول على حجز معين (للمستخدم المصادق عليه فقط)
router.get("/getById/:id", isAuthenticated, getBookingById);

// تعديل الحجز (للمستخدم فقط)
router.put("/update/:id", isAuthenticated, updateBooking);

// حذف الحجز (المستخدم يمكنه حذف حجوزه، الأدمن يمكنه حذف أي حجز)
router.delete("/delete/:id", isAuthenticated, deleteBooking);

// الموافقة على الحجز أو رفضه (الهوست فقط)
router.patch("/approve/:id", [isAuthenticated, authorizeHost], approveBooking);

module.exports = router;
