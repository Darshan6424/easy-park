import express from "express";
import { getDashboardStats, getMyLocations, testGateOpen1, testGateOpen2 } from "../controllers/owner.controllers.js";
import { protectRoute, requireOwnerRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All owner routes require authentication and owner role
router.use(protectRoute);
router.use(requireOwnerRole);

// Get dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

// Get all locations owned by logged-in owner
router.get("/locations", getMyLocations);

// Test MQTT - Open Gate 1
router.post("/test/gate1", testGateOpen1);

// Test MQTT - Open Gate 2
router.post("/test/gate2", testGateOpen2);

export default router;
