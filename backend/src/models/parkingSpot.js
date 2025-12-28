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
            lowercase: true,
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

const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema);

export default ParkingSpot;
