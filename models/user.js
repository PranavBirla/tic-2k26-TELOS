const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    contact: Number,
    password: String,
    
});

const crop = mongoose.model("user", userSchema);

module.exports = user;