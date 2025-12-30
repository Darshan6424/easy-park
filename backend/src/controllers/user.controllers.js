import * as userServices from "../services/user.services.js";

async function getUser(req, res) {
    try {
        const id = req.user._id;
        const result = await userServices.getUser(id);

        res.status(200).json({
            message: "User fetched successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error while fetching user",
            error: error.message,
        });
    }
}

async function deleteUser(req, res) {
    try {
        const id = req.user._id;
        const result = await userServices.deleteUser(id);

        res.status(200).json({
            message: "User deleted successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error while deleting user",
            error: error.message,
        });
    }
}

async function updateUser(req, res) {
    try {
        const id = req.user._id;
        console.log(req.body);

        const allowedFields = [
            "fullName",
            "address", // Fixed typo
            "deviceId",
            "email",
            "role",
        ];

        const updates = {};

        // Check each field in req.body, not each allowed field
        for (const key in req.body) {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            } else {
                throw new Error("Invalid Field Received: " + key);
            }
        }

        // Make sure at least one field is being updated
        if (Object.keys(updates).length === 0) {
            throw new Error("No valid fields to update");
        }

        const result = await userServices.updateUser(id, updates);
        res.status(200).json({
            message: "User updated Successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating the user",
            error: error.message,
        });
    }
}

export { getUser, deleteUser, updateUser };
