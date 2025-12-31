import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Navigation,
  MapPin,
  Loader2,
  AlertCircle,
  Car,
  Bike,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import Header from "../components/layout/header.jsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const parkingIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to recenter map when user location changes
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  return null;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

export default function SearchMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const type = searchParams.get("type");

    if (lat && lng) {
      setUserLocation([lat, lng]);
    } else {
      setError("No location provided");
    }

    if (type) {
      setVehicleType(type);
    } else {
      setError("No vehicle type selected");
    }

    fetchParkingLocations(type);
  }, [searchParams]);

  const fetchParkingLocations = async (type) => {
    setLoading(true);
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

        // Filter locations that have available spots for the selected vehicle type
        const filteredLocations = locationsArray.filter((location) => {
          if (!location.parkingSpots || location.parkingSpots.length === 0) {
            return false;
          }
          // Check if location has at least one available spot of the correct type
          return location.parkingSpots.some(
            (spot) => spot.type === type && !spot.isOccupied,
          );
        });

        console.log(`Filtered locations for ${type}:`, filteredLocations);
        setParkingLocations(filteredLocations);
      } else {
        setError(result.message || "Failed to fetch parking locations");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNearestLocation = () => {
    if (!userLocation || parkingLocations.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    parkingLocations.forEach((location) => {
      const [lng, lat] = location.location.coordinates;
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        lat,
        lng,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...location, distance };
      }
    });

    return nearest;
  };

  const nearestLocation = getNearestLocation();

  if (loading) {
    return (
      <>
        <Header />
        <div className="h-[calc(100vh-80px)] bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted">Loading map...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !userLocation) {
    return (
      <>
        <Header />
        <div className="h-[calc(100vh-80px)] bg-background flex items-center justify-center px-4">
          <div className="bg-error/10 border-2 border-error rounded-xl p-8 max-w-md text-center shadow-lg">
            <AlertCircle className="text-error mx-auto mb-4" size={48} />
            <p className="text-text font-semibold mb-2">Unable to Load Map</p>
            <p className="text-muted text-sm mb-4">
              {error || "Invalid location"}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (parkingLocations.length === 0) {
    return (
      <>
        <Header />
        <div className="h-[calc(100vh-80px)] bg-background flex items-center justify-center px-4">
          <div className="bg-surface border-2 border-border rounded-xl p-8 max-w-md text-center shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {vehicleType === "car" ? (
                <Car className="text-primary" size={40} strokeWidth={2.5} />
              ) : (
                <Bike className="text-secondary" size={40} strokeWidth={2.5} />
              )}
            </div>
            <p className="text-text font-bold text-lg mb-2">
              No Parking Available
            </p>
            <p className="text-muted text-sm mb-4">
              No available {vehicleType} parking spots found in this area
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Search Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Vehicle Type Badge Bar */}
      <div className="bg-surface border-b-2 border-border px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm ${
                vehicleType === "car"
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30"
                  : "bg-gradient-to-r from-secondary/20 to-secondary/10 border-2 border-secondary/30"
              }`}
            >
              {vehicleType === "car" ? (
                <Car className="text-primary" size={20} strokeWidth={2.5} />
              ) : (
                <Bike className="text-secondary" size={20} strokeWidth={2.5} />
              )}
              <span
                className={`font-bold capitalize text-sm ${
                  vehicleType === "car" ? "text-primary" : "text-secondary"
                }`}
              >
                {vehicleType} Parking
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success font-semibold text-sm">
                {parkingLocations.length} Available
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-muted hover:text-primary text-sm font-medium transition-colors hidden sm:block"
          >
            Change Search
          </button>
        </div>
      </div>

      {/* Map - Takes remaining height */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap position={userLocation} />

          {/* User Location Marker */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Navigation className="text-primary" size={20} />
                </div>
                <p className="font-bold text-text text-sm">Your Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Parking Location Markers */}
          {parkingLocations.map((location) => {
            const [lng, lat] = location.location.coordinates;
            const availableSpots = location.parkingSpots.filter(
              (spot) => spot.type === vehicleType && !spot.isOccupied,
            ).length;

            return (
              <Marker
                key={location._id}
                position={[lat, lng]}
                icon={parkingIcon}
                eventHandlers={{
                  click: () => {
                    navigate(`/location/${location._id}?type=${vehicleType}`);
                  },
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -40]}
                  className="!bg-white/95 !border-2 !border-success/30 !rounded-lg !px-2 !py-1 !shadow-lg"
                >
                  <span className="text-xs font-semibold text-gray-800">
                    {location.name}
                  </span>
                </Tooltip>
                <Popup>
                  <div className="min-w-[220px] p-2">
                    <h3 className="font-bold text-text text-base mb-2">
                      {location.name}
                    </h3>
                    {location.description && (
                      <p className="text-xs text-muted mb-3 leading-relaxed">
                        {location.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          {vehicleType === "car" ? (
                            <Car
                              className="text-success"
                              size={16}
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Bike
                              className="text-success"
                              size={16}
                              strokeWidth={2.5}
                            />
                          )}
                          <span className="text-xs font-semibold text-text">
                            Available
                          </span>
                        </div>
                        <span className="text-sm font-bold text-success">
                          {availableSpots}
                        </span>
                      </div>

                      {location.cost && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold text-muted">
                            Rate
                          </span>
                          <div className="flex items-center gap-1 text-primary font-bold text-sm">
                            <IndianRupee size={14} />
                            <span>{location.cost}/hr</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        navigate(
                          `/location/${location._id}?type=${vehicleType}`,
                        )
                      }
                      className="w-full bg-gradient-to-r from-primary to-accent text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      View & Book
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating nearest location card */}
        {nearestLocation && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-surface border-2 border-border rounded-xl p-5 shadow-2xl z-[1000] animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <MapPin className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-success/20 border border-success/30 rounded-md text-success text-xs font-bold">
                    NEAREST
                  </span>
                </div>
                <h3 className="font-bold text-text text-base mb-1">
                  {nearestLocation.name}
                </h3>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="text-primary" size={14} />
                    <span className="text-muted font-medium">
                      {nearestLocation.distance.toFixed(1)} km away
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {vehicleType === "car" ? (
                      <Car
                        className="text-success"
                        size={14}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Bike
                        className="text-success"
                        size={14}
                        strokeWidth={2.5}
                      />
                    )}
                    <span className="text-muted font-medium">
                      {
                        nearestLocation.parkingSpots.filter(
                          (spot) =>
                            spot.type === vehicleType && !spot.isOccupied,
                        ).length
                      }{" "}
                      spots available
                    </span>
                  </div>

                  {nearestLocation.cost && (
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="text-primary" size={14} />
                      <span className="text-muted font-medium">
                        रु {nearestLocation.cost} per hour
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/location/${nearestLocation._id}?type=${vehicleType}`,
                    )
                  }
                  className="w-full bg-gradient-to-r from-primary to-accent text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  View & Book
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
