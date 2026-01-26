import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";
import mongoose from "mongoose";

const FINE_MULTIPLIER = 1.5; // Fine is 1.5x the hourly rate per hour

function getLocationFromBooking(booking) {
    return (
        booking.location ||
        booking.parkingSpot?.parkingLocation ||
        booking.parkingSpot?.parkingLocation?._id
    );
}

function assertLocationScope(booking, locationId, user) {
    // Mega admin (admin@test.com) can access all locations
    if (user?.email === "admin@test.com") {
        const locationRef = getLocationFromBooking(booking);
        return locationRef?._id?.toString() || locationRef?.toString();
    }

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

    // Prevent QR code reuse after checkout
    if (booking.qrCodeUsed) {
        throw new Error("This QR code has already been used for a completed booking. Please create a new booking.");
    }

    if (booking.isCheckedIn) {
        throw new Error("Already checked in");
    }

    if (booking.status === "invalid") {
        throw new Error(
            "Booking is invalid. Grace period expired or booking was cancelled.",
        );
    }

    if (booking.status !== "pending") {
        throw new Error(
            `Cannot check in. Booking status is ${booking.status}.`,
        );
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const GRACE_PERIOD_MINUTES = 15;

    // Calculate grace window
    const earlyGraceStart = new Date(
        startTime.getTime() - GRACE_PERIOD_MINUTES * 60 * 1000,
    );
    const lateGraceEnd = new Date(
        startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000,
    );

    // Check if scan is too early (before early grace window)
    if (now < earlyGraceStart) {
        const minutesTooEarly = Math.ceil(
            (earlyGraceStart - now) / (1000 * 60),
        );
        throw new Error(
            `Too early to check in. Please arrive within 15 minutes of your booking start time. Try again in ${minutesTooEarly} minute${minutesTooEarly > 1 ? "s" : ""}.`,
        );
    }

    // Check if scan is too late (after late grace window)
    if (now > lateGraceEnd) {
        // Mark as invalid and free the spot
        booking.status = "invalid";
        await booking.save();

        await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
            isOccupied: false,
        });

        throw new Error(
            "Grace period expired. You must check in within 15 minutes of booking start time. Your spot has been released.",
        );
    }

    // Calculate arrival time relative to booking start (negative = early, positive = late)
    const arrivalDelay = Math.floor((now - startTime) / (1000 * 60)); // in minutes

    let newEndTime = new Date(endTime);
    let message = "Checked in successfully";
    let graceApplied = false;
    let graceType = null;

    // Early arrival (before start time)
    if (arrivalDelay < 0) {
        const earlyMinutes = Math.abs(arrivalDelay);
        // Reduce end time to preserve exact duration
        newEndTime = new Date(endTime.getTime() - earlyMinutes * 60 * 1000);
        graceApplied = true;
        graceType = "early";
        message = `Checked in early (${earlyMinutes} min before start). End time adjusted to ${newEndTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} to maintain booked duration.`;
    }
    // Late arrival (after start time but within grace)
    else if (arrivalDelay > 0 && arrivalDelay <= GRACE_PERIOD_MINUTES) {
        // Extend end time to preserve exact duration
        newEndTime = new Date(endTime.getTime() + arrivalDelay * 60 * 1000);
        graceApplied = true;
        graceType = "late";
        message = `Checked in late (${arrivalDelay} min after start). End time extended to ${newEndTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} to maintain booked duration.`;
    }
    // On-time arrival
    else {
        message = "Checked in on time. Enjoy your parking!";
    }

    // Activate the booking
    booking.status = "active";
    booking.actualEntryTime = now;
    booking.isCheckedIn = true;
    booking.endTime = newEndTime;
    booking.graceApplied = graceApplied;
    booking.graceType = graceType;
    booking.arrivalDelay = arrivalDelay;

    await booking.save();

    return {
        booking,
        graceApplied,
        graceType,
        arrivalDelay,
        message,
    };
}

// Check-out service - when user leaves and scans QR
export async function checkOutBookingService(bookingId, options = {}) {
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

    // Prevent QR code reuse
    if (booking.qrCodeUsed) {
        throw new Error("This QR code has already been used. Booking is completed.");
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
    const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;

    let fine = 0;
    let requiresFinePayment = false;
    let message = "Checked out successfully. Thank you!";

    // Calculate fine if overstayed (1.5x hourly rate per hour)
    if (minutesLate > 0) {
        const hourlyRate = booking.hourlyRate || 50; // fallback rate
        fine = Math.ceil(hoursLate * hourlyRate * FINE_MULTIPLIER);
        booking.fine = fine;
        booking.status = "expired"; // Mark as expired when overstay detected
        booking.finePaid = false;
        booking.attemptedCheckout = true; // User tried to checkout
        requiresFinePayment = true;
        message = `Cannot checkout - Fine pending. Please pay रु ${fine} (${hoursLate} hour${hoursLate > 1 ? "s" : ""} late) before checkout.`;
        
        // Do NOT check out, do NOT free spot
        booking.actualExitTime = null;
        booking.isCheckedOut = false;
    } else {
        // No overstay, normal checkout
        booking.fine = 0;
        booking.finePaid = false;
        booking.status = "completed";
        booking.actualExitTime = now;
        booking.isCheckedOut = true;
        booking.qrCodeUsed = true; // Mark QR as used after successful checkout
        
        // Free parking spot for normal checkout
        if (booking.parkingSpot) {
            await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                isOccupied: false,
            });
        }
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

// Pay fine service - user pays fine for expired booking
export async function payFineService(bookingId, options = {}) {
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

    if (booking.status !== "expired") {
        throw new Error("Booking is not expired. No fine to pay.");
    }

    if (!booking.attemptedCheckout) {
        throw new Error("You must scan QR at the gate first before paying fine online.");
    }

    if (booking.finePaid) {
        throw new Error("Fine already paid");
    }

    if (!booking.fine || booking.fine === 0) {
        throw new Error("No fine amount on this booking");
    }

    // Calculate extra time parked beyond booking end time
    const now = new Date();
    const endTime = new Date(booking.endTime);
    const minutesLate = Math.floor((now - endTime) / (1000 * 60));
    const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;

    // Mark fine as paid (payment simulation for demo)
    booking.finePaid = true;
    await booking.save();

    return {
        booking,
        fine: booking.fine,
        hoursLate,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        message: `Fine of रु ${booking.fine} paid successfully. You may now checkout by scanning QR at the gate.`,
    };
}

// Pay fine and checkout service - combined operation for guard scanner
export async function payFineAndCheckoutService(bookingId, options = {}) {
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

    // Prevent QR code reuse
    if (booking.qrCodeUsed) {
        throw new Error("This QR code has already been used. Booking is completed.");
    }

    if (booking.status !== "expired") {
        throw new Error("Booking is not expired");
    }

    if (booking.finePaid) {
        // Fine already paid, proceed with checkout
        if (!booking.isCheckedOut) {
            const now = new Date();
            booking.actualExitTime = now;
            booking.isCheckedOut = true;
            booking.status = "completed";
            booking.qrCodeUsed = true; // Mark QR as used

            // Free parking spot
            if (booking.parkingSpot) {
                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                    isOccupied: false,
                });
            }

            await booking.save();
        }

        return {
            booking,
            fine: booking.fine || 0,
            minutesLate: 0,
            hoursLate: 0,
            message: "Checkout completed. Thank you!",
        };
    }

    // Fine not paid yet
    throw new Error("Fine must be paid before checkout");
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

    if (!booking) {
        throw new Error("Booking not found");
    }

    assertLocationScope(booking, locationId, user);

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const GRACE_PERIOD_MINUTES = 15;

    // Calculate grace windows
    const earlyGraceStart = new Date(
        startTime.getTime() - GRACE_PERIOD_MINUTES * 60 * 1000,
    );
    const lateGraceEnd = new Date(
        startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000,
    );

    // Auto-update status if needed
    // 1. Check if pending booking is past late grace period
    if (booking.status === "pending" && now > lateGraceEnd) {
        booking.status = "invalid";
        await booking.save();

        // Free the spot
        await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
            isOccupied: false,
        });
    }

    // 2. Check if active booking is past end time
    if (
        booking.status === "active" &&
        now > endTime &&
        !booking.isCheckedOut
    ) {
        booking.status = "expired";
        await booking.save();
    }

    // Calculate if late and fine amount
    const minutesLate = Math.floor((now - endTime) / (1000 * 60));
    const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;
    
    // Calculate current fine (may differ from stored fine if time has passed)
    let currentFine = 0;
    if (minutesLate > 0 && booking.isCheckedIn) {
        const hourlyRate = booking.hourlyRate || 50;
        currentFine = Math.ceil(hoursLate * hourlyRate * 1.5);
    }

    const requiresFinePayment =
        booking.status === "expired" &&
        booking.isCheckedIn &&
        !booking.isCheckedOut &&
        !booking.finePaid &&
        (booking.fine > 0 || currentFine > 0);

    // Determine what actions are available
    const canCheckIn =
        booking.status === "pending" &&
        !booking.isCheckedIn &&
        now >= earlyGraceStart &&
        now <= lateGraceEnd;

    const canCheckOut =
        (booking.status === "active" || booking.status === "expired") &&
        booking.isCheckedIn &&
        !booking.isCheckedOut;

    // Determine if QR should be shown (pending, active, and expired)
    // Pending: user shows ticket to guard for check-in
    // Active: for checkout
    // Expired: for checkout with fine payment
    const showQR = 
        booking.status === "pending" || 
        booking.status === "active" || 
        booking.status === "expired";

    return {
        booking,
        isValid: showQR,
        canCheckIn,
        canCheckOut,
        showQR,
        requiresFinePayment,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        hoursLate,
        currentFine, // Always include current fine (0 if not applicable)
        graceWindowStart: earlyGraceStart,
        graceWindowEnd: lateGraceEnd,
        isWithinGracePeriod:
            booking.status === "pending" &&
            now >= earlyGraceStart &&
            now <= lateGraceEnd,
    };
}

// Auto-expire bookings (for cron job) - DO NOT free spots for expired, only for invalid
export async function autoExpireBookingsService() {
    const now = new Date();
    const GRACE_PERIOD_MINUTES = 15;

    // Find active bookings that are past endTime
    const expiredBookings = await Booking.find({
        endTime: { $lt: now },
        status: "active",
        isCheckedOut: false,
    }).populate("parkingSpot");

    const expiredResults = [];

    for (const booking of expiredBookings) {
        booking.status = "expired";

        if (booking.isCheckedIn) {
            // Booking was checked in but overstayed
            const minutesLate = Math.floor(
                (now - booking.endTime) / (1000 * 60),
            );
            const hoursLate = Math.ceil(minutesLate / 60);
            const hourlyRate = booking.hourlyRate || 50;
            const fine = Math.ceil(hoursLate * hourlyRate * FINE_MULTIPLIER);

            booking.fine = fine;
            booking.finePaid = false;
            booking.isCheckedOut = false;
            // Keep spot OCCUPIED until checkout/payment
        } else {
            // No-show case: never checked in, now past end time
            // Treat as invalid and free the spot
            booking.status = "invalid";
            booking.fine = 0;

            if (booking.parkingSpot) {
                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot._id, {
                    isOccupied: false,
                });
            }
        }

        await booking.save();
        expiredResults.push(booking._id);
    }

    // Find pending bookings that are past late grace period
    const lateGraceExpiredBookings = await Booking.find({
        status: "pending",
    }).populate("parkingSpot");

    const graceExpiredResults = [];

    for (const booking of lateGraceExpiredBookings) {
        const startTime = new Date(booking.startTime);
        const lateGraceEnd = new Date(
            startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000,
        );

        if (now > lateGraceEnd) {
            // Grace period expired, mark as invalid and free spot
            booking.status = "invalid";
            await booking.save();

            if (booking.parkingSpot) {
                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot._id, {
                    isOccupied: false,
                });
            }

            graceExpiredResults.push(booking._id);
        }
    }

    return {
        expiredCount: expiredResults.length,
        graceExpiredCount: graceExpiredResults.length,
        totalProcessed: expiredResults.length + graceExpiredResults.length,
        expiredBookings: expiredResults,
        graceExpiredBookings: graceExpiredResults,
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
