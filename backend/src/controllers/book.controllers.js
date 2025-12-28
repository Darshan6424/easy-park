import mongoose from "mongoose";
import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot";
import { book } from "../services/book";

export async function bookSpot(req, res) {
  const { type, duration, time, parkingSpot } = req.body;
  const user = req.user;
  try {
    if (!user || !type || !duration || !time || !parkingSpot) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const bookingDetails = {
      user,
      type,
      duration,
      time,
      parkingSpot,
    };

    const result = await book(bookingDetails);

    return res.status(201).json({
      message: "Parking booked successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error:", error.message);

    return res.status(400).json({
      message: error.message,
    });
  }
}

export async function deleteBooking(req, res) {
  const  bookingId  = req.query.id;
  const userId = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    const bookingDetails = await Booking.findById(bookingId);

    if (!bookingDetails) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (bookingDetails.userId.toString() !== userId) {
      return res.status(403).json({
        message: "You are not allowed to delete this booking",
      });
    }

    await ParkingSpot.findByIdAndUpdate(
      bookingDetails.parkingSlot,
      { isOccupied: false }
    );
    await Booking.findByIdAndDelete(bookingId);

    return res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function editBooking(req, res) {
    const { type, duration, time, parkingSpot} = req.body;
    const user = req.user;
    const bookingId = req.query.id;
    try {
        if (
      !mongoose.Types.ObjectId.isValid(bookingId) ||
      !mongoose.Types.ObjectId.isValid(parkingSpot)
    ) {
      return res.status(400).json({ message: "Invalid id provided" });
    }
        if (!bookingId || !type || !duration || !time || !parkingSpot) {
           return  res.status(401).json({message: "All field required"});
        }
        const bookingDetails = await Booking.findById(bookingId);
        const parkingSpotDetails = await ParkingSpot.findById(parkingSpot);
        if(!bookingDetails || !parkingSpotDetails){
            return res.status(404).json({message : "Booking or Parking Spot not found"});
        }
        if (bookingDetails.user._id.toString() !== user.id) {
      return res.status(403).json({
        message: "You are not allowed to delete this booking",
      });
    }
    const startTime = new Date(time);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId,{
    user,
    parkingSlot: parkingSpot,
    type,
    startTime,
    endTime,
  });
  return res.status(200).json({message : "Booking updated", data : updatedBooking})
        
    } catch (error) {
         console.error("Delete booking error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getBooking(req, res) {
    const userId = req.user.id;
    try {
        const bookedParkingSpots = await Booking.find({"user._id": userId});
        return res.status(200).json({ data: bookedParkingSpots });
    } catch (error) {
        console.error("Get booking error:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}