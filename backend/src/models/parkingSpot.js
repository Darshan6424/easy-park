import mongoose from "mongoose";

const parkingSpotSchema = new mongoose.Schema(
    {
        // 1A, 2B etc.
        spotNumber: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["car", "bike"],
        },
        isOccupied: {
            type: Boolean,
            default: false,
        },
        parkingLocation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ParkingLocation",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// Ensure unique spot numbers within each parking location
parkingSpotSchema.index(
    { spotNumber: 1, parkingLocation: 1 },
    { unique: true },
);

parkingSpotSchema.method.isParkingSpotAvailable = async function (
    enteredParkingSpot,
) {
    let isAvailable = false;
    if (enteredParkingSpot._id === this._id) {
        isAvailable = true;
    }
    return isAvailable;
};

const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema);

export default ParkingSpot;
