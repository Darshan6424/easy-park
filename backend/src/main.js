import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
<<<<<<< HEAD
import bookingRoutes from "./routes/book.routes.js";
=======
import ParkingLocationRoutes from "./routes/parkingLocation.routes.js";
>>>>>>> main
import { dbConnection } from "./lib/mongoDB.js";

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
<<<<<<< HEAD
app.use("/api", bookingRoutes);
=======
app.use("/api/location", ParkingLocationRoutes);
>>>>>>> main

app.listen(PORT, () => {
    console.log(`Server is listining to the port ${PORT}`);
    dbConnection();
});
