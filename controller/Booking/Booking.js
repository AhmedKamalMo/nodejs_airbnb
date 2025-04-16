const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const mongoose = require("mongoose");

exports.createBooking = async (req, res) => {
  try {
    const { properties } = req.body;


    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ message: "At least one property is required." });
    }


    const bookingProperties = [];

    for (const property of properties) {

      const hotel = await Hotel.findById(property.propertyId).populate("hostId");
      if (!hotel) {
        return res.status(404).json({ message: `Property with ID ${property.propertyId} not found.` });
      }

      if (!hotel.hostId) {
        return res.status(400).json({ message: `Property with ID ${property.propertyId} does not have a host.` });
      }

      const today = new Date();
      if (new Date(property.startDate) < today) {
        return res.status(400).json({ message: `Start date for property ${property.propertyId} must be in the future.` });
      }

      if (new Date(property.endDate) <= new Date(property.startDate)) {
        return res.status(400).json({ message: `End date for property ${property.propertyId} must be after the start date.` });
      }


      const overlappingBooking = await Booking.findOne({
        "properties.propertyId": property.propertyId,
        "properties.status": { $ne: "cancelled" },
        $or: [
          { "properties.startDate": { $lt: new Date(property.endDate), $gte: new Date(property.startDate) } },
          { "properties.endDate": { $gt: new Date(property.startDate), $lte: new Date(property.endDate) } },
        ],
      });

      if (overlappingBooking) {
        return res.status(400).json({ message: `Property with ID ${property.propertyId} is already booked for the selected dates.` });
      }


      bookingProperties.push({
        propertyId: property.propertyId,
        hostId: hotel.hostId._id,
        status: "pending",
        startDate: property.startDate,
        endDate: property.endDate,
        price: property.price,
        companions: property.companions,
        petsAllowed: property.petsAllowed,
        paymentStatus: property.paymentStatus,
        totalPrice: property.totalPrice,
      });
    }


    const booking = new Booking({
      userId: req.user._id,
      properties: bookingProperties,
    });

    await booking.save();
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId")
      .populate("properties.propertyId")
      .populate("properties.hostId");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getBookingsInRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const bookings = await Booking.find({
      properties: {
        $elemMatch: {
          startDate: { $gte: new Date(startDate) },
          endDate: { $lte: new Date(endDate) },
        },
      },
    })
      .populate("userId")
      .populate("hostId")
      .populate("properties.propertyId");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId")
      .populate("properties.propertyId")
      .populate("properties.hostId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isHostAuthorized = booking.properties.some(
      (property) => property.hostId && property.hostId.toString() === req.user._id.toString()
    );

    if (!isHostAuthorized) {
      return res.status(403).json({ message: "You are not authorized to view this booking" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePropertyDates = async (req, res) => {
  try {
    const { bookingId, propertyId } = req.params;
    const { startDate, endDate } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // العثور على العقار داخل الحجز
    const propertyToUpdate = booking.properties.find(
      (property) => property.propertyId.toString() === propertyId
    );

    if (!propertyToUpdate) {
      return res.status(404).json({ message: "Property not found in this booking" });
    }

    // التحقق من توفر العقار خلال التواريخ الجديدة
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: bookingId }, // استثناء الحجز الحالي
      "properties.propertyId": propertyId,
      "properties.status": { $ne: "cancelled" },
      $or: [
        { "properties.startDate": { $lt: new Date(endDate), $gte: new Date(startDate) } },
        { "properties.endDate": { $gt: new Date(startDate), $lte: new Date(endDate) } },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "New dates conflict with an existing booking." });
    }

    // تحديث التواريخ
    propertyToUpdate.startDate = startDate;
    propertyToUpdate.endDate = endDate;

    await booking.save();

    res.status(200).json({ message: "Property dates updated successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // التحقق من صلاحية المستخدم
    if (req.user.role !== "Admin" && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this booking" });
    }

    // حذف الحجز
    await Booking.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.properties.forEach((property) => {
      property.status = "confirmed";
    });

    await booking.save();

    res.status(200).json({ message: "Booking confirmed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.cancelBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     booking.properties.forEach((property) => {
//       property.status = "cancelled";
//     });

//     await booking.save();

//     res.status(200).json({ message: "Booking cancelled successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.cancelPropertyInBooking = async (req, res) => {
  try {
    const { bookingId, propertyId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // العثور على العقار داخل الحجز
    const propertyToCancel = booking.properties.find(
      (property) => property.propertyId.toString() === propertyId
    );

    if (!propertyToCancel) {
      return res.status(404).json({ message: "Property not found in this booking" });
    }

    // تحديث حالة العقار إلى "cancelled"
    propertyToCancel.status = "cancelled";

    await booking.save();

    res.status(200).json({ message: "Property cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.confirmPropertyInBooking = async (req, res) => {
  try {
    const { bookingId, propertyId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const propertyToCancel = booking.properties.find(
      (property) => property.propertyId.toString() === propertyId
    );

    if (!propertyToCancel) {
      return res.status(404).json({ message: "Property not found in this booking" });
    }

    propertyToCancel.status = "confirm";

    await booking.save();

    res.status(200).json({ message: "Property cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.getBookingsByHost = async (req, res) => {
  try {
    const hostId = req.user._id;

    const bookings = await Booking.find({
      "properties.hostId": hostId,
    })
      .populate("userId")
      .populate("properties.propertyId");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ userId })
      .populate("properties.propertyId")
      .populate("properties.hostId");

    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.calculateHostRevenue = async (req, res) => {
  try {
    const hostId = req.user._id;

    const bookings = await Booking.aggregate([
      {
        $unwind: "$properties",
      },
      {
        $match: {
          "properties.hostId": mongoose.Types.ObjectId(hostId),
          "properties.paymentStatus": "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$properties.totalPrice" },
        },
      },
    ]);

    const totalRevenue = bookings.length > 0 ? bookings[0].totalRevenue : 0;

    res.status(200).json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.filterBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const bookings = await Booking.find({
      "properties.status": status,
    })
      .populate("userId")
      .populate("properties.propertyId");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getBookedDatesForProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    console.log(req.params.propertyId);

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: "Invalid propertyId format" });
    }

    const property = await Hotel.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const bookings = await Booking.find({
      "properties.propertyId": propertyId,
      "properties.status": { $ne: "cancelled" },
    });

    const bookedDates = bookings.flatMap((booking) =>
      booking.properties
        .filter((property) => property.propertyId.toString() === propertyId)
        .map((property) => ({
          startDate: property.startDate,
          endDate: property.endDate,
        }))
    );

    res.status(200).json({ bookedDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailablePropertiesForDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // التحقق من صحة التواريخ
    if (!startDate) {
      return res.status(400).json({ message: "Start date is required" });
    }

    const targetStartDate = new Date(startDate);
    const targetEndDate = endDate ? new Date(endDate) : new Date(startDate);

    if (isNaN(targetStartDate.getTime()) || (endDate && isNaN(targetEndDate.getTime()))) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (targetStartDate > targetEndDate) {
      return res.status(400).json({ message: "Start date must be before or equal to end date" });
    }

    // البحث عن الحجوزات النشطة التي تتداخل مع النطاق الزمني المطلوب
    const bookedProperties = await Booking.find({
      properties: {
        $elemMatch: {
          status: { $ne: "cancelled" }, // استثناء الحجوزات الملغاة
          startDate: { $lt: targetEndDate },
          endDate: { $gt: targetStartDate },
        },
      },
    });

    // استخراج معرفات العقارات المحجوزة
    const bookedPropertyIds = bookedProperties.flatMap((booking) =>
      booking.properties
        .filter(
          (property) =>
            property.status !== "cancelled" &&
            new Date(property.startDate) < targetEndDate &&
            new Date(property.endDate) > targetStartDate
        )
        .map((property) => property.propertyId.toString())
    );

    // البحث عن العقارات غير المحجوزة
    const availableProperties = await Hotel.find({
      _id: { $nin: bookedPropertyIds }, // استثناء العقارات المحجوزة
    });

    res.status(200).json({ availableProperties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};