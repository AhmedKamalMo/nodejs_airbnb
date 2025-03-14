const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");


exports.createBooking = async (req, res) => {
  try {
    const { propertyId, companions, petsAllowed, startDate, endDate, totalPrice } = req.body;

    const property = await Hotel.findById(propertyId).populate("hostId"); 
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!property.hostId) {
      return res.status(400).json({ message: "This property does not have a host and cannot be booked." });
    }

    const today = new Date();
    if (new Date(startDate) < today) {
      return res.status(400).json({ message: "Start date must be in the future." });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after the start date." });
    }

    const overlappingBooking = await Booking.findOne({
      propertyId,
      $or: [
        { startDate: { $lt: new Date(endDate), $gte: new Date(startDate) } },
        { endDate: { $gt: new Date(startDate), $lte: new Date(endDate) } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "This property is already booked for the selected dates." });
    }

    const booking = new Booking({
      userId: req.user._id,
      hostId: property.hostId._id,
      propertyId,
      companions,
      petsAllowed,
      startDate,
      endDate,
      totalPrice
    });

    await booking.save();
    res.status(201).json({ message: "Booking created successfully", booking });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId hostId propertyId");
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
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) }
    }).populate("userId hostId");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("userId hostId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (req.user.role !== "Admin" && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this booking" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Booking updated successfully", updatedBooking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
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

    await Booking.updateOne({ _id: req.params.id }, { status: "confirmed" });

    res.status(200).json({ message: "Booking confirmed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await Booking.updateOne({ _id: req.params.id }, { status: "cancelled" });

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


