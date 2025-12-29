import mongoose from "mongoose";
import Booking from "../models/booking.js";
import { book, deleteBookingService, editBookingService, getOneBookingService } from "../services/book.service.js";

export async function bookSpot(req, res) {
  const { type, duration, time, parkingSlot } = req.body;
  const user = req.user;
  try {

    const bookingDetails = {
      user,
      type,
      duration,
      time,
      parkingSlot,
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
  const bookingId = req.query.id;
  const userId = req.user.id;

  try {
    const result = await deleteBookingService(bookingId, userId);
    return res.status(200).json({
      message: "Booking deleted successfully",
      data: result
    });
  } catch (error) {
    console.error("Delete booking error:", error.message);
    return res.status(500).json({ message: error.message});
  }
}
export async function editBooking(req, res) {
  try {
     const updatedBooking = await editBookingService(
      req.query.id,
      req.user.id,
      req.body
    );
    return res
      .status(200)
      .json({ message: "Booking updated", data: updatedBooking });
  } catch (error) {
    console.error("Delete booking error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getBooking(req, res) {
  try {
    const bookedParkingSpots = await Booking.find({ user: req.user.id });
    return res.status(200).json({ data: bookedParkingSpots });
  } catch (error) {
    console.error("Get booking error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getOneBooking(req, res) {
  try {
    const result = await getOneBookingService(req.query.id)
    return res.status(200).json({data : bookingDetails});
  } catch (error) {
    console.log("Error ", error);
    return res.status(500).json({message: error.message})
  }
}