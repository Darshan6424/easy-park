import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const dbConnection  = async () => {
    try {
        const mongo = await mongoose.connect(process.env.MONGO_DB_URL);
        console.log(`Connected to database ${mongo.connection.host}`)
    } catch (error) {
        console.log("Failed to connect to database.")
    }
}