import User from "../models/user.js";

async function getUser(id) {
    const user = await User.findById(id);
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}

async function deleteUser(id) {
    const user = await User.findByIdAndDelete(id);

    return user;
}

async function updateUser(id, updates) {
    const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });
    return user;
}

export { getUser, deleteUser, updateUser };
