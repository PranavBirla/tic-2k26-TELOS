const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
    cropId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crop",
        required: true
    },
    farmerId:{
        // type: mongoose.Schema.Types.ObjectId,
        // ref: "user",
        type: String,
        default: "demoFarmer"

    },
    buyerId: {
        // type: mongoose.Schema.Types.ObjectId,
        // ref: "user"
        type: String,
        default: "demoBuyer"
    },
    buyerContact: Number,
    farmerContact: Number,
    negotiatedQuantity: Number,
    offeredPrice: Number,
    farmerName: String,
    dealTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });  

const deal = mongoose.model("deal", dealSchema);

module.exports = deal;