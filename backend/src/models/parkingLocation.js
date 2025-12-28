import mongoose from "mongoose";

const parkingLocationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        description: {
            type: String,
            trim: true,
        },
        parkingSpots: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ParkingSpot",
            },
        ],
    },
    {
        timestamps: true,
    },
);

// Create 2dsphere index for geospatial queries like $near, $geoNear for finding the near points.
parkingLocationSchema.index({ location: "2dsphere" });

const ParkingLocation = mongoose.model(
    "ParkingLocation",
    parkingLocationSchema,
);

export default ParkingLocation;
