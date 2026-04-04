const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
    cropName: String,
    quantity: Number,
    price: Number,
    description: String
}, { timestamps: true }); 

const crop = mongoose.model("crop", cropSchema);

module.exports = crop;