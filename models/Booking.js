const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel", // افتراض أن لديك موديل للعقارات
      required: true,
    },
    companions: {
      type: Number,
      required: true,
      min: [1, "At least one companion is required"],
      max: [10, "Maximum 10 companions allowed"],
    },
    petsAllowed: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (value) {
          return value >= Date.now();
        },
        message: "Start date must be in the future",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return this.startDate && value > this.startDate;
        },
        message: "End date must be after the start date",
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

bookingSchema.pre("save", async function (next) {
  const existingBooking = await mongoose.model("Booking").findOne({
    propertyId: this.propertyId,
    status: { $ne: "cancelled" }, 
    $or: [
      { startDate: { $lt: this.endDate, $gte: this.startDate } }, 
      { endDate: { $gt: this.startDate, $lte: this.endDate } }, 
    ],
  });

  if (existingBooking) {
    return next(new Error("Booking date range conflicts with an existing booking."));
  }

  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
