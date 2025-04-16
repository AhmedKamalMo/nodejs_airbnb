const mongoose = require("mongoose");
const hotel_Model = require("../models/Hotel");

const addHotel = async (req, res) => {
  try {
    const hotels = req.body;
    const { _id } = req.user

    hotels.hostId = new mongoose.Types.ObjectId(_id); // Ensure hostId is an ObjectId
    // console.log(hostId);

    const new_hotel = await hotel_Model.create(hotels);
    res.status(201).json({ message: "Added to Hotel successfully", new_hotel });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const DeleteHotel = async (req, res) => {
  try {
    const hotel = await hotel_Model.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found!" });
    }
    res.status(200).json({ message: "Hotel deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const GetallHotel = async (req, res) => {
  try {
    const hotels = await hotel_Model.find().populate([
      { path: "categoryId" },
      { path: "hostId", select: "-password -__v" }
    ]);
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const GetHotelById = async (req, res) => {
  try {
    const hotel = await hotel_Model.findById(req.params.id).populate([
      { path: "categoryId" },
      { path: "hostId", select: "-password -__v" }
    ]);;
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found!" });
    }
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const UpdateByID = async (req, res) => {
  try {
    const hotel = await hotel_Model.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found!" });
    }

    // if (hotel.hostId.toString() !== req.user._id.toString()) {
    //   console.log(hotel.hostId.toString());
    //   console.log(req.user);

    //   return res.status(403).json({ message: "Access denied. You are not the owner of this hotel." });
    // }

    const updatedHotel = await hotel_Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Hotel updated successfully", updatedHotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const searchHotelByName = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required for search" });
    }

    const hotels = await hotel_Model.find({
      title: { $regex: new RegExp(title, "i") },
    });

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found" });
    }

    res.json({ message: "Hotels fetched successfully!", hotels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchHotelByAddress = async (req, res) => {
  try {
    const { country, city } = req.body.address || {};

    if (!country && !city) {
      return res.status(400).json({ error: "Country or city is required for search" });
    }

    const query = {};
    if (city) {
      query["address.city"] = { $regex: new RegExp(city, "i") };
    }
    if (country) {
      query["address.country"] = { $regex: new RegExp(country, "i") };
    }

    const hotels = await hotel_Model.find(query);

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found" });
    }

    res.json({ message: "Hotels fetched successfully!", hotels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["available", "booked", "unavailable", "maintenance"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const hotel = await hotel_Model.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json({ message: "Hotel status updated successfully", hotel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

const searchHotelByCategory = async (req, res) => {
  try {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Category is required for search" });
    }

    const hotels = await hotel_Model.find({ categoryId: id });

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found" });
    }

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const searchHotelByPrice = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.body;

    if (minPrice === undefined && maxPrice === undefined) {
      return res.status(400).json({ error: "Please provide minPrice or maxPrice" });
    }

    const query = {};

    query.pricePerNight = {};
    if (minPrice !== undefined) {
      query.pricePerNight.$gte = minPrice;
    }
    if (maxPrice !== undefined) {
      query.pricePerNight.$lte = maxPrice;
    }

    const hotels = await hotel_Model.find(query);

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found" });
    }

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const filterAll = async (req, res) => {
  try {
    // Extract query parameters
    const {
      rooms,
      path,
      minPrice,
      maxPrice,
      city,
      status,
      categoryId,
      sortBy = "createdAt",
      order = "asc",
    } = req.query;

    // Build the filter object
    let filter = {};

    if (rooms) filter.rooms = Number(rooms);
    if (path) filter.path = Number(path);

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    if (city) filter["address.city"] = new RegExp(city, "i");
    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;

    // Determine sort order
    const sortOrder = order === "desc" ? -1 : 1;

    // Fetch hotels based on the filter
    const hotels = await hotel_Model.find(filter).sort({ [sortBy]: sortOrder });

    // Respond with the results
    res.status(200).json({
      data: hotels,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  addHotel,
  DeleteHotel,
  GetallHotel,
  GetHotelById,
  UpdateByID,
  searchHotelByName,
  searchHotelByAddress,
  updateStatus,
  searchHotelByCategory,
  searchHotelByPrice,
  filterAll
};
