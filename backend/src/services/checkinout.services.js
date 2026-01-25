import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

const FINE_PER_HOUR = 100; // रु 100 per hour

function getLocationFromBooking(booking) {
    return (
        booking.location ||
        booking.parkingSpot?.parkingLocation ||
        booking.parkingSpot?.parkingLocation?._id
    );
}

function assertLocationScope(booking, locationId, user) {
    const locationRef = getLocationFromBooking(booking);
    const bookingLocationId =
        locationRef?._id?.toString() || locationRef?.toString();

    if (locationId && bookingLocationId && bookingLocationId !== locationId) {
        throw new Error("Booking does not belong to this location");
    }

    if (
        user?.role === "OWNER" &&
        locationRef?.owner &&
        locationRef.owner.toString() !== user.id.toString()
    ) {
        throw new Error("You are not authorized to manage this location");
    }

    return bookingLocationId;
}

// Check-in service - when user arrives and scans QR
export async function checkInBookingService(bookingId, options = {}) {
    const { locationId, user } = options;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation", populate: { path: "owner" } },
        })
        .populate({ path: "location", populate: { path: "owner" } });

    if (!booking) {
        throw new Error("Booking not found");
    }

    assertLocationScope(booking, locationId, user);

    if (booking.isCheckedIn) {
        throw new Error("Already checked in");
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const graceExpiryTime = new Date(booking.graceExpiryTime);
    const GRACE_PERIOD_MINUTES = 15;

    // Check if booking is still in grace period or already invalid
    if (booking.status === "invalid") {
        throw new Error(
            "Booking grace period expired. This booking is no longer valid.",
        );
    }

    // Check if beyond grace period without being marked invalid
    if (now > graceExpiryTime && booking.status === "pending-arrival") {
        booking.status = "invalid";
        await booking.save();
        throw new Error(
            "Grace period expired. You must arrive within 15 minutes of booking start time.",
        );
    }

    // Calculate arrival time relative to booking start
    const arrivalDelay = Math.floor((now - startTime) / (1000 * 60)); // minutes

    let newEndTime = new Date(booking.endTime);
    let message = "Checked in successfully";
    let graceApplied = false;

    if (booking.status === "pending-arrival" && arrivalDelay >= 0) {
        // User arrived after start time but within grace period
        if (arrivalDelay > 0 && arrivalDelay <= GRACE_PERIOD_MINUTES) {
            // Extend end time by the delay to preserve full duration
            const originalDuration = new Date(booking.endTime) - startTime;
            newEndTime = new Date(now.getTime() + originalDuration);
            graceApplied = true;
            message = `Checked in successfully. Arrived ${arrivalDelay} min late. End time extended to ${newEndTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} to preserve full duration.`;
            booking.arrivalDelay = arrivalDelay;
        } else if (arrivalDelay === 0) {
            message = "Checked in on time. Enjoy your parking!";
        }

        // Activate the booking
        booking.status = "active";
        booking.actualEntryTime = now;
        booking.isCheckedIn = true;
        booking.endTime = newEndTime;
        booking.graceApplied = graceApplied;

        await booking.save();

        return {
            booking,
            graceApplied,
            arrivalDelay: arrivalDelay > 0 ? arrivalDelay : 0,
            message,
        };
    } else if (booking.status === "active") {
        // Booking already active (shouldn't happen, but handle it)
        throw new Error("Booking is already active");
    } else {
        throw new Error("Cannot check in. Invalid booking status.");
    }
}

// Check-out service - when user leaves and scans QR
export async function checkOutBookingService(bookingId, options = {}) {
    const { locationId, user, markFinePaid = false } = options;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation", populate: { path: "owner" } },
        })
        .populate({ path: "location", populate: { path: "owner" } });

    if (!booking) {
        throw new Error("Booking not found");
    }

    assertLocationScope(booking, locationId, user);

    if (!booking.isCheckedIn) {
        throw new Error("Must check in before checking out");
    }

    if (booking.isCheckedOut && !markFinePaid) {
        throw new Error("Already checked out");
    }

    if (booking.isCheckedOut && markFinePaid) {
        return {
            booking,
            fine: booking.fine || 0,
            minutesLate: 0,
            hoursLate: 0,
            requiresFinePayment: false,
            message: "Already checked out",
        };
    }

    const now = new Date();
    const endTime = new Date(booking.endTime);
    const minutesLate = Math.floor((now - endTime) / (1000 * 60));
    const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;

    let fine = 0;
    let requiresFinePayment = false;
    let message = "Checked out successfully. Thank you!";

    // Calculate fine if late
    if (minutesLate > 0) {
        fine = hoursLate * FINE_PER_HOUR;
        booking.fine = fine;
        booking.status = "expired"; // Stay expired until payment is collected
        requiresFinePayment = !markFinePaid;
        message = `Overstay fine: रु ${fine} (${hoursLate} hour${hoursLate > 1 ? "s" : ""} late)`;

        if (markFinePaid) {
            booking.finePaid = true;
            booking.actualExitTime = now;
            booking.isCheckedOut = true;
            booking.status = "completed";
            requiresFinePayment = false;
        } else {
            booking.finePaid = false;
            booking.actualExitTime = null;
            booking.isCheckedOut = false;
        }
    } else {
        booking.fine = 0;
        booking.finePaid = false;
        booking.status = "completed";
        booking.actualExitTime = now;
        booking.isCheckedOut = true;
    }

    // Free up the parking spot only when checkout is finalized (no fine or fine paid)
    if (booking.parkingSpot && !requiresFinePayment) {
        await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
            isOccupied: false,
        });
    }

    await booking.save();

    return {
        booking,
        fine,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        hoursLate,
        requiresFinePayment,
        message,
    };
}

export async function payFineAndCheckoutService(bookingId, options = {}) {
    const checkoutResult = await checkOutBookingService(bookingId, {
        ...options,
        markFinePaid: true,
    });

    if (checkoutResult.requiresFinePayment) {
        throw new Error("Fine payment could not be completed");
    }

    return checkoutResult;
}

// Get booking status for QR scanner validation
export async function getBookingStatusService(bookingId, options = {}) {
    const { locationId, user } = options;
    const booking = await Booking.findById(bookingId)
        .populate({
            path: "parkingSpot",
            populate: { path: "parkingLocation", populate: { path: "owner" } },
        })
        .populate({ path: "location", populate: { path: "owner" } })
        .populate("user", "name email phone");
    console.log("Got to get bookingStatusService", booking);

    if (!booking) {
        throw new Error("Booking not found");
    }

    assertLocationScope(booking, locationId, user);

    // Check if booking is expired (past endTime but not checked out)
    const now = new Date();
    const endTime = new Date(booking.endTime);

    const minutesLate = Math.floor((now - endTime) / (1000 * 60));
    const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;

    if (now > endTime && !booking.isCheckedOut) {
        booking.status = "expired";
        await booking.save();
    }

    const requiresFinePayment =
        minutesLate > 0 &&
        booking.isCheckedIn &&
        !booking.isCheckedOut &&
        !booking.finePaid;

    return {
        booking,
        isValid: booking.status === "active",
        canCheckIn: !booking.isCheckedIn && booking.status === "active",
        canCheckOut: booking.isCheckedIn && !booking.isCheckedOut,
        requiresFinePayment,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        hoursLate,
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
        booking.status = "expired";

        if (booking.isCheckedIn) {
            const minutesLate = Math.floor(
                (now - booking.endTime) / (1000 * 60),
            );
            const hoursLate = Math.ceil(minutesLate / 60);
            const fine = hoursLate * FINE_PER_HOUR;

            booking.fine = fine;
            booking.finePaid = false;
            booking.isCheckedOut = false;
            // Keep spot occupied until checkout/payment
        } else {
            // No-show: free the spot for future bookings
            booking.fine = 0;
            booking.finePaid = false;
            booking.isCheckedOut = true;
            booking.actualExitTime = now;

            if (booking.parkingSpot) {
                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot._id, {
                    isOccupied: false,
                });
            }
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
