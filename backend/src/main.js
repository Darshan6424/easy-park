import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/book.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import ParkingLocationRoutes from "./routes/parkingLocation.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import { dbConnection } from "./lib/mongoDB.js";
import { scheduleExpiryChecks } from "./services/booking.expiry.service.js";
import { initializeMQTT, closeMQTT } from "./services/mqtt.service.js";

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
app.use("/api/owner", ownerRoutes);

// Connect to database and start server
dbConnection()
    .then(() => {
        console.log("Database connected successfully");

        // Initialize MQTT connection
        initializeMQTT();
        console.log("MQTT service initialized");

        // Start the booking expiry checker (runs every 10 seconds)
        scheduleExpiryChecks(0.1667); // 10 seconds = 0.1667 minutes
        console.log("Booking expiry scheduler started (10s interval)");

        app.listen(PORT, () => {
            console.log(`Server is listening to the port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    });

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing MQTT connection...');
    closeMQTT();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Closing MQTT connection...');
    closeMQTT();
    process.exit(0);
});

// Catch-all route for SPA - must be AFTER all API routes
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
