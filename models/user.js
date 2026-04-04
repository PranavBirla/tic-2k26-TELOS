const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    contact: Number,
    password: String,
    location: String,
    role: {
        type: String,
        enum: ["farmer", "buyer"]
    }
});

const user = mongoose.model("user", userSchema);

module.exports = user;