import ParkingLocation from "../models/parkingLocation.js";
import ParkingSpot from "../models/parkingSpot.js";

async function createLocation(locationData) {
    const { name, location, description, parkingSpots } = locationData;

    if (!name || !location || !parkingSpots || parkingSpots.length === 0) {
        throw new Error(
            "Name, location, and at least one parking spot are required",
        );
    }

    const parkingLocation = await ParkingLocation.create({
        name,
        location,
        description,
        parkingSpots: [],
    });

    const spotPromises = parkingSpots.map((spot) =>
        ParkingSpot.create({
            spotNumber: spot.spotNumber,
            type: spot.type,
            parkingLocation: parkingLocation._id,
        }),
    );

    const createdSpots = await Promise.all(spotPromises);

    parkingLocation.parkingSpots = createdSpots.map((spot) => spot._id);
    await parkingLocation.save();

    const populatedLocation = await ParkingLocation.findById(
        parkingLocation._id,
    ).populate("parkingSpots");

    return populatedLocation;
}

async function getAllLocations() {
    const locations = await ParkingLocation.find()
        .populate("parkingSpots")
        .sort({ createdAt: -1 });

    return locations;
}

async function deleteLocation(locationId) {
    const location = await ParkingLocation.findById(locationId);

    if (!location) {
        throw new Error("Parking location not found");
    }
    await ParkingSpot.deleteMany({ parkingLocation: locationId });
    await ParkingLocation.findByIdAndDelete(locationId);

    return { message: "Parking location and spots deleted successfully" };
}

async function updateLocation(id, locationData) {
    const { name, location, description, parkingSpots } = locationData;
    const oldLocation = await ParkingLocation.findById(id);

    if (!oldLocation) {
        throw new Error("Parking location not found");
    }

    if (name) oldLocation.name = name;
    if (location) oldLocation.location = location;
    if (description !== undefined) oldLocation.description = description;

    if (parkingSpots && parkingSpots.length > 0) {
        await ParkingSpot.deleteMany({ parkingLocation: id });

        const spotPromises = parkingSpots.map((spot) =>
            ParkingSpot.create({
                spotNumber: spot.spotNumber,
                type: spot.type,
                parkingLocation: id,
            }),
        );

        const createdSpots = await Promise.all(spotPromises);
        oldLocation.parkingSpots = createdSpots.map((spot) => spot._id);
    }

    await oldLocation.save();

    const updatedLocation =
        await ParkingLocation.findById(id).populate("parkingSpots");
    return updatedLocation;
}

export { getAllLocations, createLocation, deleteLocation, updateLocation };
