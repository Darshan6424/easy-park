import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    bookSpot,
    deleteBooking,
    editBooking,
    getBooking,
    getOneBooking,
} from "../controllers/book.controllers.js";
import {
    checkExpiredBookingsController,
    checkSingleBookingExpiryController,
    getExpiringSoonController,
} from "../controllers/expiry.check.controller.js";
import {
    checkInBooking,
    checkOutBooking,
    getBookingStatus,
    checkBookingExpiry,
    scanBooking,
    autoExpireBookings,
    getUserRevenue,
    getBookingsWithFines,
} from "../controllers/checkinout.controllers.js";

const router = express.Router();

// ============================================
// EXPIRY CHECK ROUTES (MUST BE FIRST)
// ============================================
router.get("/check-expired", protectRoute, checkExpiredBookingsController);
router.get("/expiring-soon", protectRoute, getExpiringSoonController);

// ============================================
// UTILITY ROUTES (BEFORE /:id ROUTES)
// ============================================
// Auto-expire all overdue bookings (admin/cron)
router.post("/auto-expire", protectRoute, autoExpireBookings);

// Get user revenue stats
router.get("/revenue", protectRoute, getUserRevenue);

// Get bookings with fines
router.get("/fines", protectRoute, getBookingsWithFines);

// ============================================
// REGULAR BOOKING ROUTES
// ============================================
// Create new booking
router.post("/new", protectRoute, bookSpot);

// Get all user bookings
router.get("/", protectRoute, getBooking);

// ============================================
// SPECIFIC BOOKING ROUTES (/:id ROUTES)
// ============================================
// Check-in/Check-out routes
router.post("/:id/check-in", protectRoute, checkInBooking);
router.post("/:id/check-out", protectRoute, checkOutBooking);
router.post("/:id/scan", protectRoute, scanBooking); // Smart endpoint

// Get booking status (with validation flags)
router.get("/:id/status", protectRoute, getBookingStatus);

// Legacy expiry check (backward compatibility with your scanner)
router.get("/:id/check-expiry", protectRoute, checkBookingExpiry);

// Update booking
router.post("/edit/:id", protectRoute, editBooking);

// Delete booking
router.delete("/:id", protectRoute, deleteBooking);

// Get single booking (MUST BE LAST)
router.get("/:id", protectRoute, getOneBooking);

export default router;
