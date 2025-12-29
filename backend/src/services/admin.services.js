import User from "../models/user.js";

async function getUsers() {
    try {
        const users = await User.find({});
        return users;
    } catch (error) {
        throw new Error("Failed to fetch users");
    }
}

async function deleteUser(id) {
    if (!id || id.length !== 24) {
        throw new Error("Invalid user ID");
    }
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    } catch (error) {
        throw new Error("Failed to delete user");
    }
}

export { getUsers, deleteUser };
