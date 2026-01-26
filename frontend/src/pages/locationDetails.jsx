import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getUser } from "../utils/auth.js";
import {
  MapPin,
  Car,
  Bike,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Navigation,
} from "lucide-react";

export default function LocationDetail() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleType = searchParams.get("type");

  const [location, setLocation] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState(vehicleType || "car");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const user = getUser();
  const isOwner = user?.role === "OWNER";

  useEffect(() => {
    fetchLocation();
  }, [locationId]);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location/${locationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("Location Response:", result);

      if (response.ok) {
        const locationData = result.data || result;
        setLocation(locationData);
        setParkingSpots(locationData.parkingSpots || []);
      } else {
        setError(result.message || "Failed to fetch location");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotClick = (spot) => {
    if (spot.isOccupied) return;
    if (spot.type !== selectedType) return;
    setSelectedSpot(spot);
  };

  const handleBookNow = () => {
    if (!selectedSpot) return;
    navigate(
      `/book?locationId=${locationId}&spotId=${selectedSpot._id}&type=${selectedType}`,
    );
  };

  const filteredSpots = parkingSpots.filter(
    (spot) => spot.type === selectedType,
  );
  const availableCount = filteredSpots.filter((s) => !s.isOccupied).length;

  const getGridPosition = (spotNumber) => {
    if (!spotNumber || typeof spotNumber !== "string") {
      return { row: 0, col: 0 };
    }
    const row = spotNumber.charCodeAt(0) - 65;
    const col = parseInt(spotNumber.substring(1)) - 1;
    return { row, col: isNaN(col) ? 0 : col };
  };

  const validSpots = parkingSpots.filter((spot) => spot.spotNumber);

  const maxRow = validSpots.reduce((max, spot) => {
    const pos = getGridPosition(spot.spotNumber);
    return Math.max(max, pos.row);
  }, 0);

  const maxCol = validSpots.reduce((max, spot) => {
    const pos = getGridPosition(spot.spotNumber);
    return Math.max(max, pos.col);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-error/10 border-2 border-error rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="text-error mx-auto mb-4" size={48} />
          <p className="text-text font-semibold mb-2">
            Unable to Load Location
          </p>
          <p className="text-muted text-sm mb-4">
            {error || "Location not found"}
          </p>
          <button
            onClick={() => navigate("/locations")}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="text-muted hover:text-primary mb-6 flex items-center gap-2 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Location Info */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="bg-surface border-2 border-border rounded-xl p-5 lg:p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div className="flex-1 pt-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-text mb-2">
                    {location.name}
                  </h1>
                  {location.description && (
                    <p className="text-muted text-sm leading-relaxed">
                      {location.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-border">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Location Details
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Hourly Rate</span>
                    <span className="text-lg font-bold text-primary">
                      रु {location.cost}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text text-sm font-medium">
                    <Navigation size={16} className="text-accent" />
                    <span>
                      {location.location.coordinates[1].toFixed(4)},{" "}
                      {location.location.coordinates[0].toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Type Selector - Available for everyone */}
            <div className="bg-surface border-2 border-border rounded-xl p-5 lg:p-6 shadow-sm">
              <h3 className="text-base lg:text-lg font-bold text-text mb-4">
                Select Vehicle Type
              </h3>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSelectedType("car")}
                  className={`w-full p-4 lg:p-5 rounded-xl border-2 transition-all ${
                    selectedType === "car"
                      ? "border-primary bg-gradient-to-r from-primary/20 to-primary/10 shadow-md"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div
                        className={`p-2.5 lg:p-3 rounded-xl transition-colors flex-shrink-0 ${
                          selectedType === "car"
                            ? "bg-primary shadow-sm"
                            : "bg-surface hover:bg-primary/10"
                        }`}
                      >
                        <Car
                          className={
                            selectedType === "car" ? "text-white" : "text-muted"
                          }
                          size={24}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text text-base lg:text-lg">
                          Car
                        </p>
                        <p className="text-xs lg:text-sm text-muted font-medium mt-0.5">
                          {
                            parkingSpots.filter(
                              (s) => s.type === "car" && !s.isOccupied,
                            ).length
                          }{" "}
                          available
                        </p>
                      </div>
                    </div>
                    {selectedType === "car" && (
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-primary rounded-full animate-pulse shadow-sm flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType("bike")}
                  className={`w-full p-4 lg:p-5 rounded-xl border-2 transition-all ${
                    selectedType === "bike"
                      ? "border-secondary bg-gradient-to-r from-secondary/20 to-secondary/10 shadow-md"
                      : "border-border bg-background hover:border-secondary/40 hover:bg-secondary/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div
                        className={`p-2.5 lg:p-3 rounded-xl transition-colors flex-shrink-0 ${
                          selectedType === "bike"
                            ? "bg-secondary shadow-sm"
                            : "bg-surface hover:bg-secondary/10"
                        }`}
                      >
                        <Bike
                          className={
                            selectedType === "bike"
                              ? "text-white"
                              : "text-muted"
                          }
                          size={24}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text text-base lg:text-lg">
                          Bike
                        </p>
                        <p className="text-xs lg:text-sm text-muted font-medium mt-0.5">
                          {
                            parkingSpots.filter(
                              (s) => s.type === "bike" && !s.isOccupied,
                            ).length
                          }{" "}
                          available
                        </p>
                      </div>
                    </div>
                    {selectedType === "bike" && (
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-secondary rounded-full animate-pulse shadow-sm flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Selected Spot Info */}
            {selectedSpot && (
              <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-2 border-primary rounded-xl p-5 lg:p-6 shadow-lg animate-fadeIn">
                <h3 className="text-base lg:text-lg font-bold text-text mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Selected Spot
                </h3>

                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between items-center bg-background/60 rounded-lg p-3 lg:p-4">
                    <span className="text-muted font-medium text-sm">
                      Spot Number
                    </span>
                    <span className="text-text font-bold text-lg lg:text-xl">
                      {selectedSpot.spotNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background/60 rounded-lg p-3 lg:p-4">
                    <span className="text-muted font-medium text-sm">
                      Vehicle Type
                    </span>
                    <span className="text-text font-bold capitalize text-sm lg:text-base">
                      {selectedSpot.type}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 lg:py-4 rounded-xl font-bold hover:shadow-lg transition-all text-sm lg:text-base"
                >
                  Continue to Book →
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="bg-surface border-2 border-border rounded-xl p-5 lg:p-6 shadow-sm">
              <h3 className="text-xs lg:text-sm font-bold text-text mb-4 uppercase tracking-wide">
                Legend
              </h3>

              <div className="flex flex-col gap-3 text-xs lg:text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-success to-success/70 border-2 border-success rounded-lg shadow-sm flex-shrink-0" />
                  <span className="text-text font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/20 border-2 border-primary rounded-lg shadow-sm flex-shrink-0" />
                  <span className="text-text font-medium">Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-error/20 border-2 border-error rounded-lg shadow-sm flex-shrink-0" />
                  <span className="text-text font-medium">Occupied</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-surface border-2 border-border rounded-lg opacity-50 flex-shrink-0" />
                  <span className="text-text font-medium">Other Type</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Parking Grid */}
          <div className="lg:col-span-2">
            <div className="bg-surface border-2 border-border rounded-xl p-5 lg:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
                <h2 className="text-lg lg:text-2xl font-bold text-text flex items-center gap-3">
                  <span
                    className={`p-2 lg:p-3 rounded-xl flex-shrink-0 ${selectedType === "car" ? "bg-primary/20" : "bg-secondary/20"}`}
                  >
                    {selectedType === "car" ? (
                      <Car
                        className="text-primary"
                        size={24}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Bike
                        className="text-secondary"
                        size={24}
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                  <span>Parking Layout</span>
                </h2>
                <div className="bg-background border-2 border-border rounded-lg px-4 py-2.5">
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    <span className="text-success text-base lg:text-lg">
                      {availableCount}
                    </span>
                    <span className="text-muted mx-1.5">/</span>
                    <span className="text-muted text-base lg:text-lg">
                      {filteredSpots.length}
                    </span>
                    <span className="text-muted text-xs ml-2">available</span>
                  </p>
                </div>
              </div>

              {availableCount === 0 ? (
                <div className="text-center py-12 lg:py-20 bg-background rounded-xl border-2 border-dashed border-border">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-error" size={32} />
                  </div>
                  <p className="text-text font-semibold mb-1 text-base lg:text-lg">
                    No Available Spots
                  </p>
                  <p className="text-muted text-sm">
                    All {selectedType} spots are currently occupied
                  </p>
                </div>
              ) : validSpots.length === 0 ? (
                <div className="text-center py-12 lg:py-20 bg-background rounded-xl border-2 border-dashed border-border">
                  <p className="text-muted">
                    No parking spots configured for this location
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="inline-block min-w-full">
                    {/* Entry Indicator */}
                    <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border-2 border-accent/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <span className="font-bold text-text text-sm lg:text-base">
                          PARKING LOT ENTRY
                        </span>
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div
                      className="grid gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-6 bg-background rounded-xl"
                      style={{
                        gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: maxRow + 1 }).map((_, row) =>
                        Array.from({ length: maxCol + 1 }).map((_, col) => {
                          const spotNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
                          const spot = parkingSpots.find(
                            (s) => s.spotNumber === spotNumber,
                          );

                          if (!spot) {
                            return (
                              <div
                                key={`${row}-${col}`}
                                className="aspect-square min-w-0 rounded-lg lg:rounded-xl border-2 border-dashed border-border/30 bg-surface/30"
                              />
                            );
                          }

                          const isAvailable = !spot.isOccupied;
                          const isCorrectType = spot.type === selectedType;
                          const isSelected = selectedSpot?._id === spot._id;

                          return (
                            <button
                              key={spot._id}
                              onClick={() => handleSpotClick(spot)}
                              disabled={!isAvailable || !isCorrectType}
                              className={`aspect-square min-w-0 rounded-lg lg:rounded-xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 transition-all ${
                                isSelected
                                  ? "border-success bg-gradient-to-br from-success to-success/70 shadow-lg"
                                  : !isCorrectType
                                    ? "border-border bg-surface cursor-not-allowed opacity-40"
                                    : !isAvailable
                                      ? "border-error bg-gradient-to-br from-error/30 to-error/20 cursor-not-allowed"
                                      : "border-primary/30 bg-gradient-to-br from-background to-surface hover:border-primary hover:from-primary/10 hover:to-primary/5 hover:shadow-md cursor-pointer"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-md lg:rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-white shadow-md"
                                    : !isCorrectType
                                      ? "bg-border/20"
                                      : !isAvailable
                                        ? "bg-error/40"
                                        : "bg-primary/20"
                                }`}
                              >
                                {spot.type === "car" ? (
                                  <Car
                                    size={16}
                                    className={`sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                                      isSelected
                                        ? "text-success"
                                        : !isCorrectType
                                          ? "text-muted"
                                          : !isAvailable
                                            ? "text-error"
                                            : "text-primary"
                                    }`}
                                    strokeWidth={2.5}
                                  />
                                ) : (
                                  <Bike
                                    size={16}
                                    className={`sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                                      isSelected
                                        ? "text-success"
                                        : !isCorrectType
                                          ? "text-muted"
                                          : !isAvailable
                                            ? "text-error"
                                            : "text-secondary"
                                    }`}
                                    strokeWidth={2.5}
                                  />
                                )}
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs lg:text-sm font-bold ${
                                  isSelected ? "text-white" : "text-text"
                                }`}
                              >
                                {spot.spotNumber}
                              </span>
                              {!isAvailable && (
                                <span className="text-[8px] sm:text-[10px] text-error font-bold px-1 py-0.5 bg-error/20 rounded">
                                  Full
                                </span>
                              )}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
