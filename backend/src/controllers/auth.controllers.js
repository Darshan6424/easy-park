import User from "../models/users.js";
import jwt from "jsonwebtoken"

export async function signup(req, res) {
  const {email, password, fullName, address, deviceId } = req.body;
  try {
    if (!email || !password || !fullName || !address || !deviceId) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({message: "Email already exists."})
    }
    const newUser = await User.create({
        email,
        password,
        fullName,
        address,
        deviceId,
        role: "USER"
    });
    const token = jwt.sign ({userId:newUser._id}, process.env.JWT_SECRET_KEY, {
        expiresIn : '7d'
    });
    res.cookie("jwt", token, {
        maxAge : 1000*60*60*24*7,
        httpOnly : true,
        sameSite : "strict",
    });
    res.status(201).json({sucess : true, user : newUser})
  } catch (error) {
    console.log("Error during signup: ", error);
    res.status(500).json({message : "Internal Server Error"});
  }
}