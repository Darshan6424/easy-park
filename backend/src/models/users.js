import mongoose from "mongoose";


const authSchema = mongoose.Schema({
    fullName: {
        type: String,
        required : true,
    },
    address: {
        type: String,
        required: true
    }
})
const auth = mongoose.model("auth", authSchema);

export default auth;