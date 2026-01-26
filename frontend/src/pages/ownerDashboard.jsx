import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DollarSign,
    MapPin,
    ParkingCircle,
    Activity,
    AlertCircle,
    TrendingUp,
    Navigation,
} from "lucide-react";

export default function OwnerDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Owner Dashboard mounted");
        console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            console.log("Fetching owner dashboard stats...");
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/owner/dashboard/stats`, {
                credentials: "include",
            });

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error:", errorText);
                throw new Error(`Failed to fetch dashboard stats: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Dashboard stats data:", data);
            setStats(data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold">Loading dashboard...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="bg-error/10 border-2 border-error/30 rounded-xl p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-error mb-2">Dashboard Failed to Load</h2>
                    <p className="text-sm text-muted mb-4">
                        Unable to fetch owner dashboard data. This could be because:
                    </p>
                    <ul className="text-xs text-muted text-left mb-4 space-y-1">
                        <li>• Backend server is not running</li>
                        <li>• You don't have OWNER role</li>
                        <li>• API endpoint is not accessible</li>
                        <li>• Network connection issues</li>
                    </ul>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const occupancyRate = stats.totalSpots > 0
        ? Math.round((stats.currentOccupied / stats.totalSpots) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text">Owner Dashboard</h1>
                    <p className="mt-2 text-muted">
                        Manage your parking locations and track performance
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Locations */}
                    <div className="bg-surface rounded-lg border-2 border-border p-6 hover:border-primary transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted">
                                    Total Locations
                                </p>
                                <p className="mt-2 text-3xl font-bold text-text">
                                    {stats.totalLocations}
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-surface rounded-lg border-2 border-border p-6 hover:border-success transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted">
                                    Total Revenue
                                </p>
                                <p className="mt-2 text-3xl font-bold text-success">
                                    ₹{stats.totalRevenue.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    Today: ₹{stats.todayRevenue.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg">
                                <DollarSign className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </div>

                    {/* Parking Spots */}
                    <div className="bg-surface rounded-lg border-2 border-border p-6 hover:border-secondary transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted">
                                    Parking Spots
                                </p>
                                <p className="mt-2 text-3xl font-bold text-text">
                                    {stats.currentOccupied} / {stats.totalSpots}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    Occupancy: {occupancyRate}%
                                </p>
                            </div>
                            <div className="p-3 bg-secondary/10 rounded-lg">
                                <ParkingCircle className="w-6 h-6 text-secondary" />
                            </div>
                        </div>
                    </div>

                    {/* Active Bookings */}
                    <div className="bg-surface rounded-lg border-2 border-border p-6 hover:border-accent transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted">
                                    Active Bookings
                                </p>
                                <p className="mt-2 text-3xl font-bold text-text">
                                    {stats.activeBookings}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    Peak: {stats.peakOccupancy}
                                </p>
                            </div>
                            <div className="p-3 bg-accent/10 rounded-lg">
                                <Activity className="w-6 h-6 text-accent" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {(stats.expiredBookings > 0 || stats.finesPending > 0) && (
                    <div className="bg-warning/10 border-2 border-warning rounded-lg p-4 mb-8">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-warning mr-3 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-text">
                                    Attention Required
                                </h3>
                                <div className="mt-2 text-sm text-muted">
                                    {stats.expiredBookings > 0 && (
                                        <p>• {stats.expiredBookings} expired bookings</p>
                                    )}
                                    {stats.finesPending > 0 && (
                                        <p>• {stats.finesPending} fines pending</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue by Location */}
                <div className="bg-surface border-2 border-border rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-text">
                            Revenue by Location
                        </h2>
                        <TrendingUp className="w-5 h-5 text-muted" />
                    </div>
                    {stats.revenueByLocation.length === 0 ? (
                        <p className="text-muted text-center py-8">
                            No locations found. Add a location to get started.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {stats.revenueByLocation.map((location) => (
                                <div
                                    key={location.locationId}
                                    className="flex items-center justify-between border-b border-border pb-3 last:border-b-0"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-text">
                                            {location.name}
                                        </h3>
                                        <p className="text-sm text-muted">
                                            {location.bookings} bookings
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-success">
                                            ₹{location.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate("/owner-locations")}
                        className="bg-surface border-2 border-border hover:border-primary text-text py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <MapPin className="w-5 h-5" />
                        View Locations
                    </button>
                    <button
                        onClick={() => navigate("/owner-map")}
                        className="bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-5 h-5" />
                        Manage Map
                    </button>
                    <button
                        onClick={() => navigate("/scan")}
                        className="bg-surface border-2 border-border hover:border-accent text-text py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <Activity className="w-5 h-5" />
                        QR Scanner
                    </button>
                </div>
            </div>
        </div>
    );
}
