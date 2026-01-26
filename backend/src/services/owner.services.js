import Booking from "../models/booking.js";
import ParkingLocation from "../models/parkingLocation.js";
import ParkingSpot from "../models/parkingSpot.js";

/**
 * Get owner dashboard statistics
 * Returns analytics for the logged-in owner's locations only
 */
export async function getOwnerDashboardStats(ownerId) {
    try {
        // Get all locations owned by this owner
        const locations = await ParkingLocation.find({ owner: ownerId })
            .populate("parkingSpots")
            .lean();

        if (!locations || locations.length === 0) {
            return {
                totalLocations: 0,
                totalSpots: 0,
                currentOccupied: 0,
                peakOccupancy: 0,
                todayRevenue: 0,
                totalRevenue: 0,
                activeBookings: 0,
                expiredBookings: 0,
                finesPending: 0,
                revenueByLocation: [],
            };
        }

        const locationIds = locations.map((loc) => loc._id);
        const totalLocations = locations.length;

        // Calculate total spots and current occupancy
        let totalSpots = 0;
        let currentOccupied = 0;
        locations.forEach((loc) => {
            totalSpots += loc.parkingSpots.length;
            currentOccupied += loc.parkingSpots.filter(
                (spot) => spot.isOccupied,
            ).length;
        });

        // Get all bookings for owner's locations
        const allBookings = await Booking.find({
            location: { $in: locationIds },
        }).lean();

        // Calculate today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = allBookings.filter((booking) => {
            const bookingDate = new Date(booking.createdAt);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate.getTime() === today.getTime();
        });

        const todayRevenue = todayBookings.reduce((sum, booking) => {
            return sum + (booking.totalCost || 0) + (booking.finePaid ? booking.fine || 0 : 0);
        }, 0);

        // Calculate total revenue
        const totalRevenue = allBookings.reduce((sum, booking) => {
            return sum + (booking.totalCost || 0) + (booking.finePaid ? booking.fine || 0 : 0);
        }, 0);

        // Count active and expired bookings
        const activeBookings = allBookings.filter(
            (b) => b.status === "active",
        ).length;
        const expiredBookings = allBookings.filter(
            (b) => b.status === "expired" && !b.finePaid,
        ).length;
        const finesPending = allBookings.filter(
            (b) => b.fine > 0 && !b.finePaid,
        ).length;

        // Calculate peak occupancy (highest number of active bookings in a single day)
        const bookingsByDate = {};
        allBookings.forEach((booking) => {
            if (booking.status === "active" || booking.status === "completed") {
                const date = new Date(booking.startTime).toDateString();
                bookingsByDate[date] = (bookingsByDate[date] || 0) + 1;
            }
        });
        const peakOccupancy = Math.max(0, ...Object.values(bookingsByDate));

        // Revenue by location
        const revenueByLocation = await Promise.all(
            locations.map(async (location) => {
                const locationBookings = allBookings.filter(
                    (b) => b.location.toString() === location._id.toString(),
                );
                const revenue = locationBookings.reduce((sum, booking) => {
                    return sum + (booking.totalCost || 0) + (booking.finePaid ? booking.fine || 0 : 0);
                }, 0);

                return {
                    locationId: location._id,
                    name: location.name,
                    revenue: revenue,
                    bookings: locationBookings.length,
                };
            }),
        );

        return {
            totalLocations,
            totalSpots,
            currentOccupied,
            peakOccupancy,
            todayRevenue,
            totalRevenue,
            activeBookings,
            expiredBookings,
            finesPending,
            revenueByLocation,
        };
    } catch (error) {
        console.error("Error in getOwnerDashboardStats:", error);
        throw error;
    }
}

/**
 * Get owner's locations with detailed stats
 */
export async function getOwnerLocations(ownerId) {
    try {
        const locations = await ParkingLocation.find({ owner: ownerId })
            .populate("parkingSpots")
            .populate("owner", "fullName email")
            .sort({ createdAt: -1 })
            .lean();

        // Enrich each location with stats
        const enrichedLocations = await Promise.all(
            locations.map(async (location) => {
                const spots = location.parkingSpots || [];
                const totalSpots = spots.length;
                const occupiedSpots = spots.filter((s) => s.isOccupied).length;
                
                // Get booking stats for this location
                const bookings = await Booking.find({
                    location: location._id,
                }).lean();
                
                const activeBookings = bookings.filter(b => b.status === "active").length;
                const totalBookings = bookings.length;
                const revenue = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

                return {
                    ...location,
                    stats: {
                        totalSpots,
                        occupiedSpots,
                        availableSpots: totalSpots - occupiedSpots,
                        occupancyRate: totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0,
                        activeBookings,
                        totalBookings,
                        revenue,
                    },
                };
            }),
        );

        return enrichedLocations;
    } catch (error) {
        console.error("Error in getOwnerLocations:", error);
        throw error;
    }
}
