const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
    cropName: String,
    quantity: Number,
    price: Number
});

const crop = mongoose.model("crop", cropSchema);

module.exports = crop;