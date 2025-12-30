import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsers, deleteUser } from "../controllers/admin.controllers.js";

const router = express.Router();

router.get("/", protectRoute, getUsers);
router.delete("/:id", protectRoute, deleteUser);

// router.post("/:id", protectRoute, banUser);
// router.post("/promote/:id/:role", protectRoute, promoteUser);

export default router;
