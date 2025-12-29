import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    bookSpot,
    deleteBooking,
    editBooking,
    getBooking,
} from "../controllers/book.controllers.js";

const router = express.Router();

router.post("/book-spot", protectRoute, bookSpot);
router.get("/delete-booking", protectRoute, deleteBooking);
router.post("/edit-booking", protectRoute, editBooking);
router.get("/get-bookings", protectRoute, getBooking);

export default router;
