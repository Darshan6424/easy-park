import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/book.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import ParkingLocationRoutes from "./routes/parkingLocation.routes.js";
import { dbConnection } from "./lib/mongoDB.js";
import { scheduleExpiryChecks } from "./services/booking.expiry.service.js";

dotenv.config();

const PORT = process.env.PORT;
console.log(PORT);

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/location", ParkingLocationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Connect to database and start server
dbConnection()
    .then(() => {
        console.log("Database connected successfully");

        // Start the booking expiry checker (runs every 5 minutes)
        scheduleExpiryChecks(5);
        console.log("Booking expiry scheduler started");

        app.listen(PORT, () => {
            console.log(`Server is listening to the port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    });

import mongoose from "mongoose";

console.log(mongoose.modelNames());
