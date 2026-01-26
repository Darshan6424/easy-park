import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MapPin,
    Save,
    Loader2,
    ChevronLeft,
    IndianRupee,
    Car,
    Bike,
    Trash2,
    Plus,
} from "lucide-react";

export default function OwnerEditLocation() {
    const { locationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [location, setLocation] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        cost: "",
    });

    useEffect(() => {
        fetchLocation();
    }, [locationId]);

    const fetchLocation = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/location/${locationId}`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch location");
            }

            const data = await response.json();
            const locationData = data.data || data;
            setLocation(locationData);
            setFormData({
                name: locationData.name || "",
                description: locationData.description || "",
                cost: locationData.cost || "",
            });
        } catch (error) {
            console.error("Error fetching location:", error);
            setError("Failed to load location details");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/location/edit/${locationId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description,
                        cost: parseFloat(formData.cost),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update location");
            }

            navigate("/owner-locations");
        } catch (error) {
            console.error("Error updating location:", error);
            setError("Failed to update location. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/location/delete/${locationId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete location");
            }

            navigate("/owner-locations");
        } catch (error) {
            console.error("Error deleting location:", error);
            setError("Failed to delete location. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error && !location) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate("/owner-locations")}
                        className="text-blue-600 hover:underline"
                    >
                        ← Back to Locations
                    </button>
                </div>
            </div>
        );
    }

    const carSpots = location?.parkingSpots?.filter((s) => s.type === "car") || [];
    const bikeSpots = location?.parkingSpots?.filter((s) => s.type === "bike") || [];
    const occupiedCars = carSpots.filter((s) => s.isOccupied).length;
    const occupiedBikes = bikeSpots.filter((s) => s.isOccupied).length;

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/owner-locations")}
                        className="flex items-center gap-2 text-muted hover:text-text mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Locations
                    </button>
                    <h1 className="text-3xl font-bold text-text">Edit Location</h1>
                    <p className="text-muted mt-2">Update location details and manage parking spots</p>
                </div>

                {error && (
                    <div className="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Details */}
                        <div className="bg-surface border-2 border-border rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-text mb-4">
                                Basic Information
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Location Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
                                        placeholder="e.g., Downtown Parking Lot"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Add details about access, security, landmarks..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Hourly Rate (₹) *
                                    </label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                                        <input
                                            type="number"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
                                            placeholder="70"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/owner-locations")}
                                        className="px-6 py-3 border-2 border-border rounded-lg font-semibold hover:border-primary transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Parking Spots Overview */}
                        <div className="bg-surface border-2 border-border rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-text mb-4">
                                Parking Spots
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Car className="w-6 h-6 text-primary" />
                                        <h3 className="font-semibold text-text">Car Spots</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-primary">
                                        {carSpots.length}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        {occupiedCars} occupied, {carSpots.length - occupiedCars} available
                                    </p>
                                </div>

                                <div className="bg-success/10 border-2 border-success/30 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Bike className="w-6 h-6 text-success" />
                                        <h3 className="font-semibold text-text">Bike Spots</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-success">
                                        {bikeSpots.length}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        {occupiedBikes} occupied, {bikeSpots.length - occupiedBikes} available
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-background border border-border rounded-lg">
                                <p className="text-sm text-muted">
                                    💡 To modify parking spots, use the <strong>Manage Map</strong> feature to create a new location with the desired spot configuration.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Location Info */}
                        <div className="bg-surface border-2 border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-text mb-4">
                                Location Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted">Location ID</p>
                                    <p className="font-mono text-xs text-text break-all">
                                        {locationId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted">Coordinates</p>
                                    <p className="text-text">
                                        {location?.location?.coordinates?.[1]?.toFixed(5)},{" "}
                                        {location?.location?.coordinates?.[0]?.toFixed(5)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted">Total Spots</p>
                                    <p className="text-text font-semibold">
                                        {location?.parkingSpots?.length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-error/10 border-2 border-error/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-error mb-4">
                                Danger Zone
                            </h3>
                            <p className="text-sm text-muted mb-4">
                                Once you delete a location, there is no going back. Please be certain.
                            </p>
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
