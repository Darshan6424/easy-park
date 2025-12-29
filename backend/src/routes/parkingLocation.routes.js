import express from "express";
import {
    addLocation,
    getLocations,
    deleteLocation,
    updateLocation,
} from "../controllers/parkingLocation.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", protectRoute, addLocation);
router.get("/get", protectRoute, getLocations);
router.delete("/delete/:id", protectRoute, deleteLocation);
router.put("/edit/:id", protectRoute, updateLocation);

export default router;
