const Amenity = require("../models/Amenity");

exports.createAmenity = async (req, res) => {
    try {
        const amenity = await Amenity.create(req.body);
        res.status(201).json({
            success: true,
            data: amenity,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllAmenities = async (req, res) => {
    try {
        const amenities = await Amenity.find();
        res.status(200).json({
            data: amenities,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.getAmenityById = async (req, res) => {
    try {
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity) {
            return res.status(404).json({
                message: "Amenity not found",
            });
        }
        res.status(200).json({
            data: amenity,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.updateAmenity = async (req, res) => {
    try {
        const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!amenity) {
            return res.status(404).json({
                message: "Amenity not found",
            });
        }
        res.status(200).json({
            data: amenity,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

exports.deleteAmenity = async (req, res) => {
    try {
        const amenity = await Amenity.findByIdAndDelete(req.params.id);
        if (!amenity) {
            return res.status(404).json({
                message: "Amenity not found",
            });
        }
        res.status(200).json({
            message: "Amenity deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};