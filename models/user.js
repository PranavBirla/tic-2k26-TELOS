const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    contact: Number,
    password: String,
    rol
});

const crop = mongoose.model("crop", cropSchema);

module.exports = crop;