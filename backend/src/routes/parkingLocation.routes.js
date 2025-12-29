import express from "express";
import {
    addLocation,
    getLocations,
    deleteLocation,
    updateLocation,
    getLocationsById,
} from "../controllers/parkingLocation.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", protectRoute, addLocation);
router.get("/", protectRoute, getLocations);
router.get("/:id", protectRoute, getLocationsById);
router.delete("/delete/:id", protectRoute, deleteLocation);
router.put("/edit/:id", protectRoute, updateLocation);

export default router;
