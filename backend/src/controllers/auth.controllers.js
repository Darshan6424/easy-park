import User from "../models/users.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
    const { email, password, fullName, address, deviceId } = req.body;
    try {
        if (!email || !password || !fullName || !address || !deviceId) {
            return res.status(400).json({ message: "All fields required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists." });
        }
        const newUser = await User.create({
            email,
            password,
            fullName,
            address,
            deviceId,
            role: "USER",
        });
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "7d",
            },
        );
        res.cookie("jwt", token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "strict",
        });
        res.status(200).json({ sucess: true, user: newUser });
    } catch (error) {
        console.log("Error during signup: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function signin(req, res) {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).message({ message: "All field required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).message({ message: "User Not found" });
        }
        const isPasswordCorrect = await user.isMatched(password);
        if (!isPasswordCorrect) {
            return res
                .status(500)
                .message({ message: "Password is incorrect." });
        }
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "7d",
            },
        );
        res.cookie("jwt", token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "strict",
        });
        res.status(200).json({ sucess: true, user: user });
    } catch (error) {
        console.log("Error during login : ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
