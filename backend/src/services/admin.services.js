import User from "../models/user.js";

async function getUsers() {
    const users = await User.find();
    return users;
}

async function deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    return user;
}

export { getUsers, deleteUser };
