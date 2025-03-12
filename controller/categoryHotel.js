const category_Model = require('../models/categoryHotel')

const add_category = async (req, res) => {
    var category = req.body;
    try {
        const new_category = await category_Model.create(category)
        res.status(201).json({ message: "added to Hotel successfully", new_category });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
const getcategory = async (req, res) => {
    try {
    const getallcategory=await category_Model.find();
    res.status(201).json(getallcategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
const updatecategory = async (req, res) => {
    try {
        const category = await category_Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true })
        if (!category) {
            return res.status(404).json({ message: "Hotel not found!" });
        }
        res.status(200).json({ message: "Hotel updated successfully", category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
const Deletecategory = async (req, res) => {
    try {
        const category = await category_Model.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Hotel not found!" });
        }
        res.status(200).json({ message: "Hotel deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
module.exports = {
    add_category,
    getcategory,
    updatecategory,
    Deletecategory
}
