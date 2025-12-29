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

    const spot = await ParkingSpot.findById(parkingSpot);

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

    const newBooking = await Booking.create({
        user,
        parkingSpot: spot._id,
        type,
        startTime,
        endTime,
        status: "active",
    });

    spot.isOccupied = true;
    await spot.save();

    return newBooking;
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

    await ParkingSpot.findByIdAndUpdate(bookingDetails.parkingSpot, {
        isOccupied: false,
    });
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    return deletedBooking;
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

    // If parking spot is being changed, verify it exists
    if (parkingSpot) {
        const parkingSpotDetails = await ParkingSpot.findById(parkingSpot);
        if (!parkingSpotDetails) {
            throw new Error("Parking Spot not found");
        }
    }

    const updateFields = {};

    if (type) {
        updateFields.type = type;
    }

    if (parkingSpot) {
        updateFields.parkingSpot = parkingSpot;
    }

    if (time || duration) {
        const startTime = time ? new Date(time) : bookingDetails.startTime;
        const durationToUse =
            duration !== undefined
                ? duration
                : (bookingDetails.endTime - bookingDetails.startTime) /
                  (60 * 60 * 1000);

        updateFields.startTime = startTime;
        updateFields.endTime = new Date(
            startTime.getTime() + durationToUse * 60 * 60 * 1000,
        );
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateFields,
        { new: true, runValidators: true },
    );

    return updatedBooking;
}

export async function getOneBookingService(bookingId) {
    if (!bookingId) {
        throw new Error("Booking id not found");
    }
    const bookingDetails = await Booking.findById(bookingId);
    if (!bookingDetails) {
        throw new Error("Booking not found");
    }
    return bookingDetails;
}

