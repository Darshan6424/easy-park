import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Loader2,
  Plus,
  Car,
  Bike,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUser, isLoggedIn } from "../utils/auth.js";

// Cache management
const CACHE_KEY = "parking_locations_cache";
const CACHE_TIMESTAMP_KEY = "parking_locations_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Cache helper functions
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

const setCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

export const clearLocationsCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
};

export default function Locations() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();

  const [userLocation, setUserLocation] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    getUserLocation();
    fetchParkingLocations();
  }, []);

  const getUserLocation = async () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      await getLocationFromIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("GPS Location:", { lat, lng });
        setUserLocation([lat, lng]);
        setLocationLoading(false);
      },
      async (error) => {
        console.error("GPS Error:", error);
        console.log("Falling back to IP-based location...");
        await getLocationFromIP();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      },
    );
  };

  const getLocationFromIP = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        console.log("IP-based location:", { lat, lng, city: data.city });
        setUserLocation([lat, lng]);
      } else {
        console.log("Unable to determine location");
        setUserLocation(null);
      }
    } catch (err) {
      console.error("IP location error:", err);
      setUserLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchParkingLocations = async (forceRefresh = false) => {
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log("Using cached locations data");
        setParkingLocations(cachedData);
        setUsingCache(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setUsingCache(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("Parking Locations Response:", result);

      if (response.ok) {
        const locations = result.data || result.locations || result;
        const locationsArray = Array.isArray(locations) ? locations : [];

        setParkingLocations(locationsArray);
        setCachedData(locationsArray);
      } else {
        setError(result.message || "Failed to fetch parking locations");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchParkingLocations(true);
  };

  // Calculate distances and sort locations
  const sortedLocations = userLocation
    ? parkingLocations
        .map((location) => {
          const [lng, lat] = location.location.coordinates;
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            lat,
            lng,
          );
          return { ...location, distance };
        })
        .sort((a, b) => a.distance - b.distance)
    : parkingLocations;

  if (loading || locationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
              Parking Locations
            </h1>
            <div className="flex items-center gap-2 text-muted">
              {userLocation ? (
                <>
                  <Navigation size={16} />
                  <p className="text-sm">
                    Sorted by distance from your location
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {parkingLocations.length} location(s) available
                </p>
              )}
              {usingCache && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-md ml-2">
                  Cached
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-surface border-2 border-border text-text px-3 md:px-4 py-2 md:py-3 rounded-lg font-medium hover:border-primary transition-colors flex items-center gap-2"
              title="Refresh locations"
            >
              <RefreshCw
                size={20}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Add Location Button - Only for OWNER */}
            {loggedIn && user?.role === "OWNER" && (
              <button
                onClick={() => navigate("/owner-map")}
                className="bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="hidden md:inline">Manage Locations</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error rounded-lg p-4 mb-6">
            <p className="text-text text-sm">{error}</p>
          </div>
        )}

        {/* No Locations */}
        {parkingLocations.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <MapPin className="text-background mx-auto mb-4" size={48} />
            <p className="text-text font-semibold mb-2">No Locations Found</p>
            <p className="text-muted">
              {user?.role === "OWNER"
                ? "Be the first to add a parking location!"
                : "Check back later for available parking spots"}
            </p>
          </div>
        ) : (
          /* Locations Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedLocations.map((location) => {
              const carSpots =
                location.parkingSpots?.filter(
                  (s) => s.type === "car" && !s.isOccupied,
                ).length || 0;
              const bikeSpots =
                location.parkingSpots?.filter(
                  (s) => s.type === "bike" && !s.isOccupied,
                ).length || 0;

              const [lng, lat] = location.location.coordinates;

              return (
                <div
                  key={location._id}
                  className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate(`/location/${location._id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text mb-1">
                        {location.name}
                      </h3>
                      {location.description && (
                        <p className="text-sm text-muted line-clamp-2">
                          {location.description}
                        </p>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                      <MapPin className="text-background" size={20} />
                    </div>
                  </div>

                  {/* Distance */}
                  {location.distance !== undefined && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Navigation size={14} className="text-primary" />
                      <span className="text-muted">
                        {location.distance.toFixed(1)} km away
                      </span>
                    </div>
                  )}

                  {/* Available Spots */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Car className="text-muted" size={18} />
                      <span className="text-sm text-text font-medium">
                        {carSpots} Car
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="text-muted" size={18} />
                      <span className="text-sm text-text font-medium">
                        {bikeSpots} Bike
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/map?lat=${lat}&lng=${lng}&type=car`);
                      }}
                      className="bg-surface border-2 border-border text-text px-4 py-2 rounded-lg text-sm font-medium hover:border-primary transition-colors"
                    >
                      Map
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/location/${location._id}`);
                      }}
                      className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
