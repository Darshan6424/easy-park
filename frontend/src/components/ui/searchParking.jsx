import { useState } from "react";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  Car,
  Bike,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SearchParking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: initial, 1: vehicle type, 2: location
  const [vehicleType, setVehicleType] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVehicleSelect = (type) => {
    setVehicleType(type);
    setStep(2);
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      await getLocationFromIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("GPS Location:", { lat, lng });
        navigate(`/map?lat=${lat}&lng=${lng}&type=${vehicleType}`);
        setLoading(false);
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
        navigate(`/map?lat=${lat}&lng=${lng}&type=${vehicleType}`);
      } else {
        setError("Unable to determine your location. Please search manually.");
      }
    } catch (err) {
      console.error("IP location error:", err);
      setError("Unable to determine your location. Please search manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();

    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          location,
        )}&limit=1`,
      );

      const data = await response.json();
      console.log("Nominatim Response:", data);

      if (data.length > 0) {
        const lat = data[0].lat;
        const lng = data[0].lon;
        console.log("Found location:", { lat, lng });
        navigate(`/map?lat=${lat}&lng=${lng}&type=${vehicleType}`);
      } else {
        setError("Location not found. Please try a different search.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
      {/* Step 0: Initial - Book Now Button */}
      {step === 0 && (
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="text-white" size={40} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Ready to Park?
          </h2>
          <p className="text-lg text-muted mb-8">
            Find and reserve your parking spot in seconds
          </p>
          <button
            onClick={() => setStep(1)}
            className="bg-primary text-white px-12 py-5 rounded-lg font-semibold text-xl hover:opacity-90 transition-opacity inline-flex items-center gap-3"
          >
            Book Now
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Step 1: Vehicle Type Selection */}
      {step === 1 && (
        <div className="animate-slideIn">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
              Select Your Vehicle
            </h2>
            <p className="text-muted">Choose your vehicle type to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
            <button
              onClick={() => handleVehicleSelect("car")}
              className="bg-background border-2 border-border hover:border-primary rounded-xl p-8 transition-all group hover:scale-105"
            >
              <Car
                className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform"
                size={64}
              />
              <p className="text-2xl font-bold text-text">Car</p>
            </button>

            <button
              onClick={() => handleVehicleSelect("bike")}
              className="bg-background border-2 border-border hover:border-primary rounded-xl p-8 transition-all group hover:scale-105"
            >
              <Bike
                className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform"
                size={64}
              />
              <p className="text-2xl font-bold text-text">Bike</p>
            </button>
          </div>

          <button
            onClick={() => setStep(0)}
            className="mt-6 text-muted hover:text-text text-sm mx-auto block"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 2: Location Search */}
      {step === 2 && (
        <div className="animate-slideIn">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary bg-opacity-10 px-4 py-2 rounded-full mb-4">
              {vehicleType === "car" ? (
                <Car className="text-white" size={20} />
              ) : (
                <Bike className="text-white" size={20} />
              )}
              <span className="text-white font-semibold capitalize">
                {vehicleType}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
              Find Parking Near You
            </h2>
            <p className="text-muted">
              Search for a location or use your current position
            </p>
          </div>

          {/* Manual Search */}
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchLocation(e)}
                placeholder="Enter city, area, or address..."
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text text-lg"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSearchLocation}
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity mt-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search Location
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-muted font-medium">OR</span>
            </div>
          </div>

          {/* Use Current Location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full border-2 border-primary text-primary py-4 rounded-lg font-medium text-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation size={20} />
                Use My Current Location
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-error bg-opacity-10 border border-error rounded-lg p-4">
              <p className="text-text text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            className="mt-6 text-muted hover:text-text text-sm mx-auto block"
          >
            ← Change Vehicle
          </button>
        </div>
      )}
    </div>
  );
}
