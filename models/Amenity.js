const mongoose = require("mongoose");

const AmenitySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Amenity name is required"],
        trim: true,
        unique: true, 
    },
    icon: {
        type: String,
        required: [true, "Amenity icon is required"],
        trim: true,
    },
});

const Amenity = mongoose.model("Amenity", AmenitySchema);

module.exports = Amenity;