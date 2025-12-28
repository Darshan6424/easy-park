import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    parkingSlot: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    vehicleType: {
        type: String,
        required: true,
        enum: ["Bike", "Car"],
    },
    startTime: {
        type: Date,
        required: true,
    },
    // user will provide duration, calculate end date from start + duration
    endTime: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["active", "expired", "completed"],
    },
});
