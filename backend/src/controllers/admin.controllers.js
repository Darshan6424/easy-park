import * as adminServices from "../services/admin.services.js";

async function getUsers(req, res) {
    try {
        const result = await adminServices.getUsers();
        res.status(200).json({
            message: "User fetched successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message,
        });
    }
}

async function deleteUser(req, res) {
    try {
        const result = await adminServices.deleteUser(req.params.id);
        res.status(200).json({
            message: "User deleted successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete users",
            error: error.message,
        });
    }
}

export { getUsers, deleteUser };
