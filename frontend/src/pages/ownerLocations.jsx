import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Edit, Trash2, PlusCircle, TrendingUp } from "lucide-react";

export default function OwnerLocations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/owner/locations`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch locations");
            }

            const data = await response.json();
            setLocations(data);
        } catch (error) {
            console.error("Error fetching locations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (locationId, locationName) => {
        if (!confirm(`Are you sure you want to delete "${locationName}"? This action cannot be undone.`)) {
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

            // Refresh locations after delete
            fetchLocations();
        } catch (error) {
            console.error("Error deleting location:", error);
            alert("Failed to delete location. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold">Loading locations...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text">My Locations</h1>
                        <p className="mt-2 text-muted">
                            Manage your parking locations
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/owner-map")}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add Location
                    </button>
                </div>

                {/* Locations List */}
                {locations.length === 0 ? (
                    <div className="bg-surface border-2 border-border rounded-lg p-12 text-center">
                        <MapPin className="w-16 h-16 text-muted mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-text mb-2">
                            No Locations Yet
                        </h2>
                        <p className="text-muted mb-6">
                            Get started by adding your first parking location
                        </p>
                        <button
                            onClick={() => navigate("/owner-map")}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Add Your First Location
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {locations.map((location) => (
                            <div
                                key={location._id}
                                className="bg-surface border-2 border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
                            >
                                {/* Location Header */}
                                <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">
                                                {location.name}
                                            </h3>
                                            <p className="text-primary-100 text-sm">
                                                ₹{location.cost}/hour
                                            </p>
                                        </div>
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                </div>

                                {/* Location Stats */}
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-background border border-border p-4 rounded-lg">
                                            <p className="text-sm text-muted mb-1">Total Spots</p>
                                            <p className="text-2xl font-bold text-text">
                                                {location.stats.totalSpots}
                                            </p>
                                        </div>
                                        <div className="bg-background border border-border p-4 rounded-lg">
                                            <p className="text-sm text-muted mb-1">Available</p>
                                            <p className="text-2xl font-bold text-success">
                                                {location.stats.availableSpots}
                                            </p>
                                        </div>
                                        <div className="bg-background border border-border p-4 rounded-lg">
                                            <p className="text-sm text-muted mb-1">Occupancy</p>
                                            <p className="text-2xl font-bold text-primary">
                                                {location.stats.occupancyRate}%
                                            </p>
                                        </div>
                                        <div className="bg-background border border-border p-4 rounded-lg">
                                            <p className="text-sm text-muted mb-1">Active</p>
                                            <p className="text-2xl font-bold text-accent">
                                                {location.stats.activeBookings}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Revenue */}
                                    <div className="bg-success/10 border border-success/30 p-4 rounded-lg mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-success mb-1 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4" />
                                                    Total Revenue
                                                </p>
                                                <p className="text-2xl font-bold text-success">
                                                    ₹{location.stats.revenue.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted">
                                                    {location.stats.totalBookings} bookings
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="mb-6">
                                        <p className="text-sm text-gray-600 mb-1">Address</p>
                                        <p className="text-gray-900">{location.address || "No address provided"}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/owner/edit-location/${location._id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Location
                                        </button>
                                        <button
                                            onClick={() => handleDelete(location._id, location.name)}
                                            className="flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Back to Dashboard */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate("/owner-dashboard")}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
