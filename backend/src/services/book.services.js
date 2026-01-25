import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

export async function book(bookingDetails) {
    const { user, type, duration, time, parkingSpot } = bookingDetails;

    if (!user || !type || !duration || !time || !parkingSpot) {
        throw new Error("All fields required");
    }

    if (
        !mongoose.Types.ObjectId.isValid(user) ||
        !mongoose.Types.ObjectId.isValid(parkingSpot)
    ) {
        throw new Error("Invalid userId or parkingSpot");
    }

    // Populate parkingLocation to get the location reference
    const spot =
        await ParkingSpot.findById(parkingSpot).populate("parkingLocation");
    if (!spot) {
        throw new Error("Parking spot not found");
    }

    if (spot.isOccupied) {
        throw new Error("Parking spot already occupied");
    }

    if (spot.type !== type.toLowerCase()) {
        throw new Error("Vehicle type does not match parking spot type");
    }

    const startTime = new Date(time);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    const hourlyRate = spot.parkingLocation?.cost || 0;
    const totalCost = hourlyRate * duration;

    // Create booking with location reference from the parking spot
    const newBooking = await Booking.create({
        user,
        parkingSpot: spot._id,
        location: spot.parkingLocation._id, // Set location from spot's parkingLocation
        type,
        startTime,
        endTime,
        status: "pending",
        hourlyRate,
        durationHours: duration,
        totalCost,
    });

    // Mark spot as occupied
    spot.isOccupied = true;
    await spot.save();

    // Return populated booking
    const populatedBooking = await Booking.findById(newBooking._id)
        .populate({
            path: "parkingSpot",
            populate: {
                path: "parkingLocation", // This matches the field in ParkingSpot schema
            },
        })
        .populate("location"); // Direct population of location field

    return populatedBooking;
}

export async function deleteBookingService(bookingId, userId) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking id");
    }

    const bookingDetails = await Booking.findById(bookingId);
    if (!bookingDetails) {
        throw new Error("Booking not found");
    }

    if (bookingDetails.user.toString() !== userId) {
        throw new Error("You are not allowed to delete this booking");
    }

    // Only allow cancellation of pending bookings (not yet checked in)
    if (bookingDetails.status !== "pending") {
        throw new Error(
            `Cannot cancel booking with status: ${bookingDetails.status}. Only pending bookings can be cancelled.`,
        );
    }

    // Mark as invalid instead of deleting
    bookingDetails.status = "invalid";
    await bookingDetails.save();

    // Free up the parking spot
    await ParkingSpot.findByIdAndUpdate(bookingDetails.parkingSpot, {
        isOccupied: false,
    });

    return bookingDetails;
}

export async function editBookingService(
    bookingId,
    userId,
    { type, duration, time, parkingSpot },
) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking id provided");
    }

    if (parkingSpot && !mongoose.Types.ObjectId.isValid(parkingSpot)) {
        throw new Error("Invalid parking spot id provided");
    }

    const bookingDetails = await Booking.findById(bookingId);
    if (!bookingDetails) {
        throw new Error("Booking not found");
    }

    if (bookingDetails.user.toString() !== userId) {
        throw new Error("You are not allowed to edit this booking");
    }

    const updateFields = {};

    // Track rate/duration for consistent pricing
    let hourlyRate = bookingDetails.hourlyRate;
    let durationHours =
        (bookingDetails.endTime - bookingDetails.startTime) / (60 * 60 * 1000);

    // If parking spot is being changed, update location as well
    if (parkingSpot) {
        const parkingSpotDetails =
            await ParkingSpot.findById(parkingSpot).populate("parkingLocation");
        if (!parkingSpotDetails) {
            throw new Error("Parking Spot not found");
        }
        updateFields.parkingSpot = parkingSpot;
        updateFields.location = parkingSpotDetails.parkingLocation._id;
        hourlyRate = parkingSpotDetails.parkingLocation?.cost || hourlyRate || 0;
    }

    if (type) {
        updateFields.type = type;
    }

    if (time || duration !== undefined) {
        const startTime = time ? new Date(time) : bookingDetails.startTime;
        durationHours =
            duration !== undefined
                ? duration
                : (bookingDetails.endTime - bookingDetails.startTime) /
                  (60 * 60 * 1000);

        updateFields.startTime = startTime;
        updateFields.endTime = new Date(
            startTime.getTime() + durationHours * 60 * 60 * 1000,
        );
    }

    // Recalculate pricing if we have a rate
    if (hourlyRate) {
        updateFields.hourlyRate = hourlyRate;
    }
    if (durationHours) {
        updateFields.durationHours = durationHours;
    }
    if (hourlyRate && durationHours) {
        updateFields.totalCost = hourlyRate * durationHours;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateFields,
        { new: true, runValidators: true },
    )
        .populate({
            path: "parkingSpot",
            populate: {
                path: "parkingLocation", // This matches ParkingSpot schema
            },
        })
        .populate("location");

    return updatedBooking;
}

export async function getOneBookingService(bookingId) {
    if (!bookingId) {
        throw new Error("Booking id not found");
    }
    console.log("🔥 POPULATE SERVICE HIT");

    const bookingDetails = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: {
                path: "parkingLocation", // Nested population
            },
        })
        .populate("location") // Direct location reference
        .populate("user", "name email"); // Also get user details

    if (!bookingDetails) {
        throw new Error("Booking not found");
    }

    return bookingDetails;
}

export async function getAllBookingsService(userId) {
    const bookings = await Booking.find({ user: userId })
        .populate({
            path: "parkingSpot",
            populate: {
                path: "parkingLocation", // This should populate the location
            },
        })
        .populate("location") // Also populate direct location reference
        .sort({ createdAt: -1 });

    return bookings;
}
