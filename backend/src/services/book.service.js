import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

export async function book(bookingDetails) {
  const { user, type, duration, time, parkingSlot } = bookingDetails;
   if (!user || !type || !duration || !time || !parkingSlot) {
      throw new Error("All fields required");
    }
  if (
    !mongoose.Types.ObjectId.isValid(user) ||
    !mongoose.Types.ObjectId.isValid(parkingSlot)
  ) {
    throw new Error("Invalid userId or parkingSpot");
  }

  const spot = await ParkingSpot.findById(parkingSlot);

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
    parkingSlot: spot._id,
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
      throw new Error("Booking not found" );
    }
    if (bookingDetails.user.toString() !== userId) {
      throw new Error( "You are not allowed to delete this booking",
      );
    }

    await ParkingSpot.findByIdAndUpdate(bookingDetails.parkingSlot, {
      isOccupied: false,
    });
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    return deletedBooking;
}

export async function editBookingService(
  bookingId,
  userId,
  { type, duration, time, parkingSpot }
) {
  if (
    !mongoose.Types.ObjectId.isValid(bookingId) ||
    !mongoose.Types.ObjectId.isValid(parkingSpot)
  ) {
    throw new Error("Invalid id provided");
  }

  if (!type || !duration || !time || !parkingSpot) {
    throw new Error("All fields are required");
  }

  const bookingDetails = await Booking.findById(bookingId);
  const parkingSpotDetails = await ParkingSpot.findById(parkingSpot);

  if (!bookingDetails || !parkingSpotDetails) {
    throw new Error("Booking or Parking Spot not found");
  }

  if (bookingDetails.user.toString() !== userId) {
    throw new Error("You are not allowed to edit this booking");
  }

  const startTime = new Date(time);
  const endTime = new Date(
    startTime.getTime() + duration * 60 * 60 * 1000
  );

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      parkingSlot: parkingSpot,
      type,
      startTime,
      endTime,
    },
    { new: true }
  );

  return updatedBooking;
}
export async function getOneBookingService(bookingId) {
  if(!bookingId) {
      throw new Error("Booking id not found");
    }
    const bookingDetails = await Booking.findById(bookingId);
    if(!bookingDetails) {
      throw new Error("Booking not found")
    }
    return bookingDetails;
}