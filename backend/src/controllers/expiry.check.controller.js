import {
    checkAndUpdateExpiredBookings,
    checkSingleBookingExpiry,
    getBookingsExpiringSoon,
} from "../services/booking.expiry.service.js";

/**
 * Manually trigger check for all expired bookings
 * GET /api/booking/check-expired
 */
export async function checkExpiredBookingsController(req, res) {
    try {
        const result = await checkAndUpdateExpiredBookings();

        return res.status(200).json({
            success: true,
            message: `Updated ${result.count} expired bookings`,
            data: result,
        });
    } catch (error) {
        console.error("Check expired bookings error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to check expired bookings",
        });
    }
}

/**
 * Check if a specific booking is expired
 * GET /api/booking/:id/check-expiry
 */
export async function checkSingleBookingExpiryController(req, res) {
    try {
        const { id } = req.params;
        const result = await checkSingleBookingExpiry(id);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Check booking expiry error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to check booking expiry",
        });
    }
}

/**
 * Get bookings expiring soon
 * GET /api/booking/expiring-soon?minutes=30
 */
export async function getExpiringSoonController(req, res) {
    try {
        const minutes = parseInt(req.query.minutes) || 30;
        const bookings = await getBookingsExpiringSoon(minutes);

        return res.status(200).json({
            success: true,
            message: `Found ${bookings.length} bookings expiring within ${minutes} minutes`,
            data: bookings,
        });
    } catch (error) {
        console.error("Get expiring bookings error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch expiring bookings",
        });
    }
}
