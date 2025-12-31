import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    // device id should create in fronted
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["ADMIN", "OWNER", "USER"],
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
});
// use this to check password entred is correct or not wwhile login
userSchema.methods.isMatched = async function (enteredPassword) {
    const isPasswordCorrect = bcrypt.compare(enteredPassword, this.password);
    return isPasswordCorrect;
};

//this function executes before saving into db, it make hash of password
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
