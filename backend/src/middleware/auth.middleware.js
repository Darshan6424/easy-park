import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided." });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid token" });
        }
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No user found" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in auth middleware: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Block owners from booking parking spots
export const blockOwnerBooking = async (req, res, next) => {
    if (req.user.role === "OWNER") {
        return res.status(403).json({
            message: "Owners cannot book parking spots. This feature is for users only.",
            error: "OWNER_BOOKING_FORBIDDEN"
        });
    }
    next();
};

// Validate user is an owner
export const requireOwnerRole = async (req, res, next) => {
    if (req.user.role !== "OWNER" && req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access denied. Owner role required.",
        });
    }
    next();
};
