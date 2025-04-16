const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    properties: [
      {
        propertyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hotel",
          required: [true, "Property ID is required"],
        },
        hostId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Host ID is required"],
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
          default: "pending",
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
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        companions: {
          type: Number,
          required: [true, "Number of companions is required"],
          min: [1, "At least one companion is required"],
          max: [10, "Maximum 10 companions allowed"],
        },
        petsAllowed: {
          type: Boolean,
          default: false,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "paid", "failed"],
          default: "pending",
        },
        totalPrice: {
          type: Number,
          required: [true, "Total price is required"],
          min: [0, "Total price cannot be negative"],
        },
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.pre("save", async function (next) {
  try {
    for (const property of this.properties) {
      const conflictingBooking = await mongoose.model("Booking").findOne({
        "properties.propertyId": property.propertyId,
        "properties.status": { $ne: "cancelled" },
        $or: [
          {
            "properties.startDate": { $lt: property.endDate, $gte: property.startDate },
          },
          {
            "properties.endDate": { $gt: property.startDate, $lte: property.endDate },
          },
        ],
      });

      if (conflictingBooking) {
        return next(new Error(`Booking conflict for property ID: ${property.propertyId}`));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;