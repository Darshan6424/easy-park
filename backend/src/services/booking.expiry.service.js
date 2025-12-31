import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";

/**
 * Check and update expired bookings
 * Updates booking status to 'expired' and frees up parking spots
 */
export async function checkAndUpdateExpiredBookings() {
    try {
        const now = new Date();

        // Find all active bookings that have passed their end time
        const expiredBookings = await Booking.find({
            status: "active",
            endTime: { $lt: now },
        });

        console.log(
            `Found ${expiredBookings.length} expired bookings to update`,
        );

        // Update each expired booking
        const updatePromises = expiredBookings.map(async (booking) => {
            // Update booking status to expired
            booking.status = "expired";
            await booking.save();

            // Free up the parking spot
            await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                isOccupied: false,
            });

            return booking._id;
        });

        const updatedIds = await Promise.all(updatePromises);

        return {
            success: true,
            count: updatedIds.length,
            bookingIds: updatedIds,
        };
    } catch (error) {
        console.error("Error checking expired bookings:", error);
        throw error;
    }
}

/**
 * Check if a specific booking is expired
 * @param {string} bookingId - The booking ID to check
 */
export async function checkSingleBookingExpiry(bookingId) {
    try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        const now = new Date();
        const isExpired = booking.status === "active" && booking.endTime < now;

        if (isExpired) {
            // Update booking to expired
            booking.status = "expired";
            await booking.save();

            // Free up the parking spot
            await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                isOccupied: false,
            });

            return {
                success: true,
                wasExpired: true,
                booking,
            };
        }

        return {
            success: true,
            wasExpired: false,
            booking,
        };
    } catch (error) {
        console.error("Error checking single booking expiry:", error);
        throw error;
    }
}

/**
 * Schedule periodic checks for expired bookings
 * Call this when server starts
 * @param {number} intervalMinutes - How often to check (default: 5 minutes)
 */
export function scheduleExpiryChecks(intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(
        `Scheduling booking expiry checks every ${intervalMinutes} minutes`,
    );

    // Run immediately on startup
    checkAndUpdateExpiredBookings();

    // Then run periodically
    setInterval(async () => {
        console.log("Running scheduled expiry check...");
        try {
            const result = await checkAndUpdateExpiredBookings();
            if (result.count > 0) {
                console.log(`Updated ${result.count} expired bookings`);
            }
        } catch (error) {
            console.error("Scheduled expiry check failed:", error);
        }
    }, intervalMs);
}

/**
 * Get bookings expiring soon (within next X minutes)
 * @param {number} withinMinutes - Time window to check (default: 30 minutes)
 */
export async function getBookingsExpiringSoon(withinMinutes = 30) {
    try {
        const now = new Date();
        const futureTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

        const expiringBookings = await Booking.find({
            status: "active",
            endTime: {
                $gte: now,
                $lte: futureTime,
            },
        })
            .populate({
                path: "parkingSpot",
                populate: {
                    path: "parkingLocation",
                },
            })
            .populate("location")
            .populate("user", "name email");

        return expiringBookings;
    } catch (error) {
        console.error("Error getting expiring bookings:", error);
        throw error;
    }
}
