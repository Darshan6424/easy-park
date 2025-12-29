import booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

export async function book(bookingDetails) {
  const { user, type, duration, time, parkingSlot } = bookingDetails;

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

  const newBooking = await booking.create({
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
