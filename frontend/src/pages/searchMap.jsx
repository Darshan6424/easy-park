import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  Navigation,
  MapPin,
  Loader2,
  AlertCircle,
  Car,
  Bike,
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
          <div className="bg-error bg-opacity-10 border border-error rounded-lg p-8 max-w-md text-center">
            <AlertCircle className="text-error mx-auto mb-4" size={48} />
            <p className="text-text font-semibold mb-2">Unable to Load Map</p>
            <p className="text-muted text-sm mb-4">
              {error || "Invalid location"}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
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
          <div className="bg-surface border border-border rounded-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-muted bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              {vehicleType === "car" ? (
                <Car className="text-black" size={32} />
              ) : (
                <Bike className="text-black" size={32} />
              )}
            </div>
            <p className="text-text font-semibold mb-2">No Parking Available</p>
            <p className="text-muted text-sm mb-4">
              No available {vehicleType} parking spots found in this area
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
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

      {/* Vehicle Type Badge */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary bg-opacity-10 px-3 py-1.5 rounded-full">
              {vehicleType === "car" ? (
                <Car className="text-primary" size={18} />
              ) : (
                <Bike className="text-primary" size={18} />
              )}
              <span className="text-primary font-semibold capitalize text-sm">
                {vehicleType} Parking
              </span>
            </div>
            <span className="text-muted text-sm">
              {parkingLocations.length} location(s) available
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-muted hover:text-text text-sm transition-colors"
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
              <div className="text-center">
                <Navigation className="text-primary mx-auto mb-1" size={20} />
                <p className="font-semibold text-sm">Your Location</p>
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
                    navigate(`/booking/${location._id}?type=${vehicleType}`);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-text mb-1">
                      {location.name}
                    </h3>
                    {location.description && (
                      <p className="text-xs text-muted mb-2">
                        {location.description}
                      </p>
                    )}
                    <p className="text-xs text-muted mb-2">
                      {availableSpots} {vehicleType} spot(s) available
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/booking/${location._id}?type=${vehicleType}`)
                      }
                      className="w-full bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Book Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating nearest location card */}
        {nearestLocation && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-surface border border-border rounded-lg p-4 shadow-xl z-[1000]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text mb-1">
                  Nearest Location
                </h3>
                <p className="text-sm font-medium text-text">
                  {nearestLocation.name}
                </p>
                <p className="text-xs text-muted mb-1">
                  {nearestLocation.distance.toFixed(1)} km away
                </p>
                <p className="text-xs text-muted mb-3">
                  {
                    nearestLocation.parkingSpots.filter(
                      (spot) => spot.type === vehicleType && !spot.isOccupied,
                    ).length
                  }{" "}
                  {vehicleType} spot(s) available
                </p>
                <button
                  onClick={() =>
                    navigate(
                      `/booking/${nearestLocation._id}?type=${vehicleType}`,
                    )
                  }
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
