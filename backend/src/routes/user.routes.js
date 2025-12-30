import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getUser,
    updateUser,
    deleteUser,
} from "../controllers/user.controllers.js";

const router = express.Router();

router.get("/", protectRoute, getUser);
router.post("/", protectRoute, updateUser);
router.delete("/", protectRoute, deleteUser);

export default router;
