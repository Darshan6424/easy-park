import * as parkingLocationService from "../services/parkingLocation.service.js";

async function addLocation(req, res) {
    try {
        const location = await parkingLocationService.createLocation(req.body);

        res.status(201).json({
            message: "Parking location created successfully",
            data: location,
        });
    } catch (error) {
        res.status(error.message.includes("required") ? 400 : 500).json({
            message: error.message || "Error creating parking location",
            error: error.message,
        });
    }
}

async function getLocations(_, res) {
    try {
        const locations = await parkingLocationService.getAllLocations();

        res.status(200).json({
            count: locations.length,
            data: locations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching parking locations",
            error: error.message,
        });
    }
}

async function deleteLocation(req, res) {
    try {
        const { id } = req.params;
        const result = await parkingLocationService.deleteLocation(id);

        res.status(200).json({
            message: result.message,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting parking location",
            error: error.message,
        });
    }
}

async function updateLocation(req, res) {
    try {
        const { id } = req.params;
        const result = await parkingLocationService.updateLocation(
            id,
            req.body,
        );

        res.status(200).json({
            message: "Location Updated Successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting parking location",
            error: error.message,
        });
    }
}

export { getLocations, addLocation, deleteLocation, updateLocation };
