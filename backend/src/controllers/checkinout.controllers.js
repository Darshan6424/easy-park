import {
    checkInBookingService,
    checkOutBookingService,
    getBookingStatusService,
    autoExpireBookingsService,
    calculateRevenueService,
    getBookingsWithFinesService,
    payFineAndCheckoutService,
} from "../services/checkinout.services.js";

// Check-in controller
export async function checkInBooking(req, res) {
    try {
        const { bookingId } = req.params;
        const { locationId } = req.body || {};
        const result = await checkInBookingService(bookingId, {
            locationId,
            user: req.user,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                booking: result.booking,
                graceApplied: result.graceApplied,
                minutesLate: result.minutesLate,
            },
        });
    } catch (error) {
        console.error("Check-in error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Check-out controller
export async function checkOutBooking(req, res) {
    try {
        const { bookingId } = req.params;
        const { locationId } = req.body || {};
        const result = await checkOutBookingService(bookingId, {
            locationId,
            user: req.user,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                booking: result.booking,
                fine: result.fine,
                minutesLate: result.minutesLate,
                hoursLate: result.hoursLate,
            },
        });
    } catch (error) {
        console.error("Check-out error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Get booking status
export async function getBookingStatus(req, res) {
    try {
        const { bookingId } = req.params;
        const { locationId } = req.query;
        const result = await getBookingStatusService(bookingId, {
            locationId,
            user: req.user,
        });

        return res.status(200).json({
            success: true,
            data: {
                booking: result.booking,
                isValid: result.isValid,
                canCheckIn: result.canCheckIn,
                canCheckOut: result.canCheckOut,
                requiresFinePayment: result.requiresFinePayment,
                minutesLate: result.minutesLate,
                hoursLate: result.hoursLate,
            },
        });
    } catch (error) {
        console.error("Get booking status error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Legacy expiry check
export async function checkBookingExpiry(req, res) {
    try {
        const { bookingId } = req.params;
        const result = await getBookingStatusService(bookingId);

        return res.status(200).json({
            success: true,
            data: {
                booking: result.booking,
                isValid: result.isValid,
                canCheckIn: result.canCheckIn,
                canCheckOut: result.canCheckOut,
            },
        });
    } catch (error) {
        console.error("Check expiry error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Smart scan endpoint
export async function scanBooking(req, res) {
    try {
        const { id } = req.params;
        const { locationId } = req.body || {};
        console.log("reached in first controller,", id);

        // Get booking status
        const statusResult = await getBookingStatusService(id, {
            locationId,
            user: req.user,
        });
        console.log("reachec back from firt helper, 3", statusResult);
        const { booking, canCheckIn, canCheckOut } = statusResult;

        if (canCheckIn) {
            // Check-in
            const checkInResult = await checkInBookingService(id, {
                locationId,
                user: req.user,
            });
            return res.status(200).json({
                success: true,
                action: "check-in",
                message: checkInResult.message,
                data: {
                    booking: checkInResult.booking,
                    graceApplied: checkInResult.graceApplied,
                    minutesLate: checkInResult.minutesLate,
                },
            });
        } else if (canCheckOut) {
            // Check-out
            const checkOutResult = await checkOutBookingService(id, {
                locationId,
                user: req.user,
            });

            const action = checkOutResult.requiresFinePayment
                ? "fine-payment"
                : "check-out";

            return res.status(200).json({
                success: true,
                action,
                message: checkOutResult.message,
                data: {
                    booking: checkOutResult.booking,
                    fine: checkOutResult.fine,
                    minutesLate: checkOutResult.minutesLate,
                    hoursLate: checkOutResult.hoursLate,
                    requiresFinePayment:
                        checkOutResult.requiresFinePayment,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                action: "none",
                message: `Booking is ${booking.status}. No action available.`,
                data: { booking },
            });
        }
    } catch (error) {
        console.error("Scan booking error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Auto-expire
export async function autoExpireBookings(req, res) {
    try {
        const result = await autoExpireBookingsService();
        return res.status(200).json({
            success: true,
            message: `Successfully expired ${result.expiredCount} booking(s)`,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Pay fine then complete checkout
export async function payFineAndCheckout(req, res) {
    try {
        const { id } = req.params;
        const { locationId } = req.body || {};

        const result = await payFineAndCheckoutService(id, {
            locationId,
            user: req.user,
        });

        return res.status(200).json({
            success: true,
            message: "Fine paid and checkout completed",
            data: {
                booking: result.booking,
                fine: result.fine,
                minutesLate: result.minutesLate,
                hoursLate: result.hoursLate,
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Revenue stats
export async function getUserRevenue(req, res) {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        const result = await calculateRevenueService(
            userId,
            startDate,
            endDate,
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

// Bookings with fines
export async function getBookingsWithFines(req, res) {
    try {
        const userId = req.user.id;
        const bookings = await getBookingsWithFinesService(userId);

        return res.status(200).json({
            success: true,
            data: bookings,
            count: bookings.length,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
