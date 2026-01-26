import express from "express";
import { getDashboardStats, getMyLocations } from "../controllers/owner.controllers.js";
import { protectRoute, requireOwnerRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All owner routes require authentication and owner role
router.use(protectRoute);
router.use(requireOwnerRole);

// Get dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

// Get all locations owned by logged-in owner
router.get("/locations", getMyLocations);

export default router;
