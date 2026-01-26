import { getOwnerDashboardStats, getOwnerLocations } from "../services/owner.services.js";

/**
 * Get dashboard statistics for the logged-in owner
 */
export async function getDashboardStats(req, res) {
    try {
        const ownerId = req.user._id;
        const stats = await getOwnerDashboardStats(ownerId);
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
}

/**
 * Get all locations owned by the logged-in owner
 */
export async function getMyLocations(req, res) {
    try {
        const ownerId = req.user._id;
        const locations = await getOwnerLocations(ownerId);
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error in getMyLocations:", error);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
}
