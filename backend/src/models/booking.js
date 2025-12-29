import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    parkingSpot: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "parkingSpot",
    },
    type: {
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

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

