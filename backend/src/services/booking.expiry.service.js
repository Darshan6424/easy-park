import Booking from "../models/booking.js";
import ParkingSpot from "../models/parkingSpot.js";

/**
 * Check and update expired bookings
 * Handles both booking expiry and grace period expiry
 */
export async function checkAndUpdateExpiredBookings() {
    try {
        const now = new Date();
        const GRACE_PERIOD_MINUTES = 15;

        // 1. Find active bookings that have passed their end time
        const expiredBookings = await Booking.find({
            status: "active",
            endTime: { $lt: now },
            isCheckedOut: false,
        });

        console.log(`Found ${expiredBookings.length} expired bookings`);

        // Update expired bookings - DO NOT free spots (they stay occupied until checkout)
        const expiredPromises = expiredBookings.map(async (booking) => {
            booking.status = "expired";

            if (booking.isCheckedIn) {
                // Calculate fine for overstay (1.5x hourly rate)
                const minutesLate = Math.floor(
                    (now - booking.endTime) / (1000 * 60),
                );
                const hoursLate = Math.ceil(minutesLate / 60);
                const hourlyRate = booking.hourlyRate || 50;
                const fine = Math.ceil(hoursLate * hourlyRate * 1.5);

                booking.fine = fine;
                booking.finePaid = false;
                // Keep spot OCCUPIED until payment/checkout
            } else {
                // No-show: never checked in, treat as invalid
                booking.status = "invalid";
                booking.fine = 0;

                // Free the spot for no-shows
                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                    isOccupied: false,
                });
            }

            await booking.save();
            return booking._id;
        });

        // 2. Find pending bookings and check if grace period expired
        const pendingBookings = await Booking.find({
            status: "pending",
        });

        console.log(`Found ${pendingBookings.length} pending bookings to check`);

        const graceExpiredPromises = pendingBookings
            .filter((booking) => {
                const startTime = new Date(booking.startTime);
                const lateGraceEnd = new Date(
                    startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000,
                );
                return now > lateGraceEnd;
            })
            .map(async (booking) => {
                // Grace period expired, mark as invalid and free spot
                booking.status = "invalid";
                await booking.save();

                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                    isOccupied: false,
                });

                return booking._id;
            });

        const [expiredIds, graceExpiredIds] = await Promise.all([
            Promise.all(expiredPromises),
            Promise.all(graceExpiredPromises),
        ]);

        console.log(
            `Processed ${expiredIds.length} expired bookings and ${graceExpiredIds.length} grace-expired bookings`,
        );

        return {
            success: true,
            expiredCount: expiredIds.length,
            graceExpiredCount: graceExpiredIds.length,
            totalCount: expiredIds.length + graceExpiredIds.length,
            expiredBookingIds: expiredIds,
            graceExpiredBookingIds: graceExpiredIds,
        };
    } catch (error) {
        console.error("Error checking expired bookings:", error);
        throw error;
    }
}

/**
 * Check if a specific booking is expired or grace-expired
 * @param {string} bookingId - The booking ID to check
 */
export async function checkSingleBookingExpiry(bookingId) {
    try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        const now = new Date();
        const GRACE_PERIOD_MINUTES = 15;
        let statusChanged = false;

        // Check if active booking is expired
        if (
            booking.status === "active" &&
            booking.endTime < now &&
            !booking.isCheckedOut
        ) {
            booking.status = "expired";

            if (booking.isCheckedIn) {
                // Calculate fine for overstay
                const minutesLate = Math.floor(
                    (now - booking.endTime) / (1000 * 60),
                );
                const hoursLate = Math.ceil(minutesLate / 60);
                const hourlyRate = booking.hourlyRate || 50;
                const fine = Math.ceil(hoursLate * hourlyRate * 1.5);

                booking.fine = fine;
                booking.finePaid = false;
                // Keep spot occupied
            } else {
                // No-show
                booking.status = "invalid";
                booking.fine = 0;

                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                    isOccupied: false,
                });
            }

            await booking.save();
            statusChanged = true;
        }

        // Check if pending booking is past grace period
        if (booking.status === "pending") {
            const startTime = new Date(booking.startTime);
            const lateGraceEnd = new Date(
                startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000,
            );

            if (now > lateGraceEnd) {
                booking.status = "invalid";
                await booking.save();

                await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
                    isOccupied: false,
                });

                statusChanged = true;
            }
        }

        return {
            success: true,
            statusChanged,
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
