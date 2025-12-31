import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

// Check-in service - when user arrives and scans QR
export async function checkInBookingService(bookingId) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation" },
        })
        .populate("location");

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.status !== "active") {
        throw new Error(`Booking is ${booking.status}, cannot check in`);
    }

    if (booking.isCheckedIn) {
        throw new Error("Already checked in");
    }

    const now = new Date();
    const originalStartTime = new Date(booking.startTime);
    const minutesLate = Math.floor((now - originalStartTime) / (1000 * 60));

    const GRACE_PERIOD_MINUTES = 15;
    let adjustedStartTime = originalStartTime;
    let adjustedEndTime = new Date(booking.endTime);
    let graceApplied = false;

    // Apply grace period logic
    if (minutesLate > 0 && minutesLate <= GRACE_PERIOD_MINUTES) {
        // Within grace period - extend full duration
        const originalDuration = new Date(booking.endTime) - originalStartTime;
        adjustedStartTime = now;
        adjustedEndTime = new Date(now.getTime() + originalDuration);
        graceApplied = true;

        // Store original times for reference
        booking.originalStartTime = originalStartTime;
        booking.originalEndTime = new Date(booking.endTime);
    } else if (minutesLate > GRACE_PERIOD_MINUTES) {
        // Late beyond grace period - keep original times, time is lost
        // Don't adjust times, user loses the minutes
    }

    // Update booking
    booking.actualEntryTime = now;
    booking.isCheckedIn = true;
    booking.startTime = adjustedStartTime;
    booking.endTime = adjustedEndTime;
    booking.graceApplied = graceApplied;

    await booking.save();

    return {
        booking,
        graceApplied,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        message: graceApplied
            ? `Checked in successfully. Grace period applied - you still get full ${Math.floor((adjustedEndTime - adjustedStartTime) / (1000 * 60 * 60))} hours.`
            : minutesLate > GRACE_PERIOD_MINUTES
              ? `Checked in. You're ${minutesLate} minutes late. ${minutesLate - GRACE_PERIOD_MINUTES} minutes lost.`
              : "Checked in successfully",
    };
}

// Check-out service - when user leaves and scans QR
export async function checkOutBookingService(bookingId) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation" },
        })
        .populate("location");

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (!booking.isCheckedIn) {
        throw new Error("Must check in before checking out");
    }

    if (booking.isCheckedOut) {
        throw new Error("Already checked out");
    }

    const now = new Date();
    const endTime = new Date(booking.endTime);
    const minutesLate = Math.floor((now - endTime) / (1000 * 60));

    let fine = 0;
    const FINE_PER_HOUR = 100; // रु 100 per hour

    // Calculate fine if late
    if (minutesLate > 0) {
        const hoursLate = Math.ceil(minutesLate / 60);
        fine = hoursLate * FINE_PER_HOUR;
        booking.fine = fine;
        booking.status = "expired"; // Mark as expired if they overstayed
    } else {
        booking.status = "completed"; // Normal completion
    }

    booking.actualExitTime = now;
    booking.isCheckedOut = true;

    // Free up the parking spot
    if (booking.parkingSpot) {
        await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
            isOccupied: false,
        });
    }

    await booking.save();

    return {
        booking,
        fine,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        hoursLate: minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0,
        message:
            fine > 0
                ? `Checked out. Overstay fine: रु ${fine} (${Math.ceil(minutesLate / 60)} hour${Math.ceil(minutesLate / 60) > 1 ? "s" : ""} late)`
                : "Checked out successfully. Thank you!",
    };
}

// Get booking status for QR scanner validation
export async function getBookingStatusService(bookingId) {
    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation" },
        })
        .populate("location")
        .populate("user", "name email phone");
    console.log("Got to get bookingStatusService", booking);

    if (!booking) {
        throw new Error("Booking not found");
    }

    // Check if booking is expired (past endTime but not checked out)
    const now = new Date();
    const endTime = new Date(booking.endTime);

    if (now > endTime && !booking.isCheckedOut) {
        booking.status = "expired";
        await booking.save();
    }

    return {
        booking,
        isValid: booking.status === "active",
        canCheckIn: !booking.isCheckedIn && booking.status === "active",
        canCheckOut: booking.isCheckedIn && !booking.isCheckedOut,
    };
}

// Auto-expire bookings (for cron job)
export async function autoExpireBookingsService() {
    const now = new Date();

    // Find active bookings that are past endTime and not checked out
    const expiredBookings = await Booking.find({
        endTime: { $lt: now },
        status: "active",
        isCheckedOut: false,
    }).populate("parkingSpot");

    const results = [];

    for (const booking of expiredBookings) {
        // If checked in but not checked out, calculate fine
        if (booking.isCheckedIn) {
            const minutesLate = Math.floor(
                (now - booking.endTime) / (1000 * 60),
            );
            const hoursLate = Math.ceil(minutesLate / 60);
            const fine = hoursLate * 100;

            booking.fine = fine;
            booking.actualExitTime = now; // Assume they left now
            booking.isCheckedOut = true;
        }

        booking.status = "expired";

        // Free up the parking spot
        if (booking.parkingSpot) {
            await ParkingSpot.findByIdAndUpdate(booking.parkingSpot._id, {
                isOccupied: false,
            });
        }

        await booking.save();
        results.push(booking._id);
    }

    return {
        expiredCount: results.length,
        expiredBookings: results,
    };
}

// Calculate total revenue including fines
export async function calculateRevenueService(userId, startDate, endDate) {
    const query = { user: userId };

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }

    const bookings = await Booking.find(query);

    const totalRevenue = bookings.reduce((sum, booking) => {
        return sum + (booking.totalCost || 0);
    }, 0);

    const totalFines = bookings.reduce((sum, booking) => {
        return sum + (booking.fine || 0);
    }, 0);

    return {
        totalBookings: bookings.length,
        totalRevenue,
        totalFines,
        grandTotal: totalRevenue + totalFines,
    };
}

// Get all bookings with fines
export async function getBookingsWithFinesService(userId) {
    const bookings = await Booking.find({
        user: userId,
        fine: { $gt: 0 }, // Only bookings with fines
    })
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation" },
        })
        .populate("location")
        .sort({ createdAt: -1 });

    return bookings;
}
