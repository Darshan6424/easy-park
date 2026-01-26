import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUser } from "../utils/auth.js";
import {
  Car,
  Bike,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  IndianRupee,
  CheckCircle,
  Plus,
  Minus,
  TimerReset,
  CreditCard,
} from "lucide-react";
import { 
  notifyBookingCreated, 
  requestNotificationPermission 
} from "../utils/notifications";

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getUser();
  const isOwner = user?.role === "OWNER";

  // Get pre-filled data from URL params
  const locationId = searchParams.get("locationId");
  const urlSpotId = searchParams.get("spotId");
  const urlType = searchParams.get("type");

  const [step, setStep] = useState(urlSpotId && urlType ? 3 : 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Location data
  const [location, setLocation] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);

  // Booking data
  const [bookingData, setBookingData] = useState({
    type: urlType || "",
    parkingSpot: urlSpotId || "",
    time: "",
    duration: 1,
  });

  useEffect(() => {
    if (!locationId) {
      setError("No location specified");
      setLoading(false);
      return;
    }
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

  const filteredSpots = parkingSpots.filter(
    (spot) => !bookingData.type || spot.type === bookingData.type,
  );

  const availableSpots = filteredSpots.filter((spot) => !spot.isOccupied);

  const handleVehicleSelect = (type) => {
    setBookingData({ ...bookingData, type, parkingSpot: "" });
    setStep(2);
  };

  const handleSpotSelect = (spotId) => {
    setBookingData({ ...bookingData, parkingSpot: spotId });
    setStep(3);
  };

  const handleTimeConfirm = () => {
    if (!bookingData.time) {
      setError("Please select start time");
      return;
    }
    setError("");
    setStep(4);
  };

  const calculateTotal = () => {
    if (!location?.cost || !bookingData.duration) return 0;
    return location.cost * bookingData.duration;
  };

  // Set current time
  const setCurrentTime = () => {
    const now = new Date();
    const offsetTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000,
    );
    const formatted = offsetTime.toISOString().slice(0, 16);
    setBookingData({ ...bookingData, time: formatted });
  };

  // Adjust duration
  const adjustDuration = (change) => {
    const newDuration = Math.max(
      1,
      Math.min(24, bookingData.duration + change),
    );
    setBookingData({ ...bookingData, duration: newDuration });
  };

  const handleBooking = async () => {
    setLoading(true);
    setError("");

    try {
      // Format the booking data for API
      const requestBody = {
        type: bookingData.type,
        parkingSpot: bookingData.parkingSpot,
        time: new Date(bookingData.time).toISOString(),
        duration: bookingData.duration,
      };

      console.log("Booking request:", requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/new`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody),
        },
      );

      const result = await response.json();
      console.log("Booking Response:", result);

      if (response.ok || result.success) {
        // Clear any cached bookings since we have a new one
        localStorage.removeItem("bookings_cache");
        localStorage.removeItem("bookings_timestamp");

        // Request notification permission and send booking confirmation
        const hasPermission = await requestNotificationPermission();
        if (hasPermission && result.data) {
          notifyBookingCreated(result.data);
        }

        // Success! Navigate to booking ticket
        const bookingId = result.data?._id;
        if (bookingId) {
          navigate(`/booking/${bookingId}`);
        } else {
          navigate("/my-bookings");
        }
      } else {
        setError(result.message || "Booking failed");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-error/10 border-2 border-error rounded-xl p-8 max-w-md text-center shadow-lg">
          <p className="text-text font-bold text-lg mb-2">Error</p>
          <p className="text-muted text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-muted hover:text-primary mb-6 flex items-center gap-2 transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="bg-surface border-2 border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <MapPin className="text-white" size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text mb-2">
                  {location?.name}
                </h1>
                {location?.description && (
                  <p className="text-muted text-sm">{location.description}</p>
                )}
              </div>
              {location?.cost && (
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg px-4 py-2">
                  <p className="text-xs text-muted uppercase font-semibold mb-1">
                    Rate
                  </p>
                  <div className="flex items-center gap-1 text-primary font-bold text-lg">
                    <IndianRupee size={18} />
                    <span>{location.cost}/hr</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s <= step
                    ? "bg-gradient-to-br from-primary to-accent text-white shadow-md"
                    : "bg-surface border-2 border-border text-muted"
                }`}
              >
                {s < step ? <CheckCircle size={20} /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`w-8 md:w-12 h-1 mx-1 transition-all ${
                    s < step
                      ? "bg-gradient-to-r from-primary to-accent"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Vehicle Type */}
        {step === 1 && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text mb-6 text-center">
              Select Vehicle Type
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => handleVehicleSelect("car")}
                className="bg-background border-2 border-border hover:border-primary rounded-xl p-8 transition-all group hover:shadow-lg"
              >
                <div className="w-20 h-20 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                  <Car
                    className="text-primary group-hover:text-white transition-colors"
                    size={48}
                    strokeWidth={2.5}
                  />
                </div>
                <p className="text-xl font-bold text-text mb-2">Car</p>
                <p className="text-sm text-muted">
                  {
                    parkingSpots.filter(
                      (s) => s.type === "car" && !s.isOccupied,
                    ).length
                  }{" "}
                  spots available
                </p>
              </button>

              <button
                onClick={() => handleVehicleSelect("bike")}
                className="bg-background border-2 border-border hover:border-secondary rounded-xl p-8 transition-all group hover:shadow-lg"
              >
                <div className="w-20 h-20 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary transition-colors">
                  <Bike
                    className="text-secondary group-hover:text-white transition-colors"
                    size={48}
                    strokeWidth={2.5}
                  />
                </div>
                <p className="text-xl font-bold text-text mb-2">Bike</p>
                <p className="text-sm text-muted">
                  {
                    parkingSpots.filter(
                      (s) => s.type === "bike" && !s.isOccupied,
                    ).length
                  }{" "}
                  spots available
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Spot Selection */}
        {step === 2 && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">
                Select Parking Spot
              </h2>
              <div className="px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
                <span className="text-success font-bold text-sm">
                  {availableSpots.length} available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
              {filteredSpots.map((spot) => (
                <button
                  key={spot._id}
                  onClick={() => !spot.isOccupied && handleSpotSelect(spot._id)}
                  disabled={spot.isOccupied}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 p-3 transition-all ${
                    spot.isOccupied
                      ? "bg-error/10 border-error cursor-not-allowed opacity-40"
                      : bookingData.parkingSpot === spot._id
                        ? "bg-gradient-to-br from-success to-success/70 border-success text-white shadow-lg"
                        : "bg-background border-border hover:border-primary hover:bg-primary/5 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      bookingData.parkingSpot === spot._id
                        ? "bg-white"
                        : spot.isOccupied
                          ? "bg-error/20"
                          : "bg-primary/20"
                    }`}
                  >
                    {spot.type === "car" ? (
                      <Car
                        size={20}
                        strokeWidth={2.5}
                        className={
                          bookingData.parkingSpot === spot._id
                            ? "text-success"
                            : spot.isOccupied
                              ? "text-error"
                              : "text-primary"
                        }
                      />
                    ) : (
                      <Bike
                        size={20}
                        strokeWidth={2.5}
                        className={
                          bookingData.parkingSpot === spot._id
                            ? "text-success"
                            : spot.isOccupied
                              ? "text-error"
                              : "text-secondary"
                        }
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold ${bookingData.parkingSpot === spot._id ? "text-white" : "text-text"}`}
                  >
                    {spot.spotNumber}
                  </span>
                  {spot.isOccupied && (
                    <span className="text-[10px] text-error font-bold">
                      Full
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="text-muted hover:text-primary flex items-center gap-2 transition-colors font-medium"
            >
              <ChevronLeft size={20} />
              Change Vehicle Type
            </button>
          </div>
        )}

        {/* Step 3: Time & Duration */}
        {step === 3 && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text mb-6">
              Select Date, Time & Duration
            </h2>

            <div className="max-w-md mx-auto space-y-6">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Start Date & Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={bookingData.time}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, time: e.target.value })
                    }
                    min={new Date().toISOString().slice(0, 16)}
                    className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                  />
                  <button
                    onClick={setCurrentTime}
                    className="px-4 py-3 bg-accent/20 border-2 border-accent/30 text-accent rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2 font-medium"
                    title="Set to current time"
                  >
                    <TimerReset size={20} />
                    <span className="hidden sm:inline text-sm">Now</span>
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  Duration (hours)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustDuration(-1)}
                    disabled={bookingData.duration <= 1}
                    className="w-12 h-12 bg-background border-2 border-border rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus size={20} className="text-text" strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={bookingData.duration}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        duration: parseInt(e.target.value) || 1,
                      })
                    }
                    className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text text-center font-bold text-lg transition-colors"
                  />
                  <button
                    onClick={() => adjustDuration(1)}
                    disabled={bookingData.duration >= 24}
                    className="w-12 h-12 bg-background border-2 border-border rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} className="text-text" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Cost Preview */}
              {location?.cost && bookingData.duration > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted font-semibold uppercase mb-1">
                        Estimated Cost
                      </p>
                      <p className="text-sm text-muted">
                        रु {location.cost}/hr × {bookingData.duration} hr
                        {bookingData.duration > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold text-2xl">
                      <IndianRupee size={24} />
                      <span>{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-error/10 border-2 border-error rounded-lg p-4">
                  <p className="text-text text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(urlSpotId ? 1 : 2)}
                  className="flex-1 border-2 border-border text-text px-6 py-3 rounded-lg font-medium hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleTimeConfirm}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text mb-6 text-center">
              Review & Confirm Booking
            </h2>

            <div className="max-w-md mx-auto space-y-6">
              <div className="bg-background border-2 border-border rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Location</span>
                  <span className="text-text font-bold">{location?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Vehicle Type</span>
                  <span className="text-text font-bold capitalize flex items-center gap-2">
                    {bookingData.type === "car" ? (
                      <Car size={16} strokeWidth={2.5} />
                    ) : (
                      <Bike size={16} strokeWidth={2.5} />
                    )}
                    {bookingData.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Parking Spot</span>
                  <span className="text-text font-bold">
                    {
                      parkingSpots.find(
                        (s) => s._id === bookingData.parkingSpot,
                      )?.spotNumber
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Start Time</span>
                  <span className="text-text font-bold text-sm">
                    {new Date(bookingData.time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Duration</span>
                  <span className="text-text font-bold">
                    {bookingData.duration} hour
                    {bookingData.duration > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">
                      Total Amount
                    </p>
                    <p className="text-xs text-white/60">
                      रु {location?.cost}/hr × {bookingData.duration} hr
                      {bookingData.duration > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-3xl">
                    <IndianRupee size={28} />
                    <span>{calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 border-2 border-border text-text px-6 py-3 rounded-lg font-medium hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Payment
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text mb-6 text-center">
              Payment
            </h2>

            <div className="max-w-md mx-auto space-y-6">
              {/* Payment Demo Notice */}
              <div className="bg-warning/10 border-2 border-warning rounded-xl p-4 text-center">
                <p className="text-warning font-semibold text-sm">
                  🎭 Demo Payment Mode
                </p>
                <p className="text-muted text-xs mt-1">
                  This is a demonstration. No actual payment will be processed.
                </p>
              </div>

              {/* Amount Card */}
              <div className="bg-gradient-to-br from-primary via-primary to-accent rounded-xl p-8 text-white shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={32} strokeWidth={2} />
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-2">
                    Amount to Pay
                  </p>
                  <div className="flex items-center justify-center gap-2 font-bold text-5xl mb-4">
                    <IndianRupee size={40} />
                    <span>{calculateTotal()}</span>
                  </div>
                  <p className="text-white/60 text-xs">
                    for {bookingData.duration} hour
                    {bookingData.duration > 1 ? "s" : ""} parking
                  </p>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="bg-background border-2 border-border rounded-xl p-5 space-y-3">
                <p className="text-muted text-xs font-semibold uppercase">
                  Payment Summary
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Location</span>
                  <span className="text-text font-medium">
                    {location?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Spot</span>
                  <span className="text-text font-medium">
                    {
                      parkingSpots.find(
                        (s) => s._id === bookingData.parkingSpot,
                      )?.spotNumber
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Duration</span>
                  <span className="text-text font-medium">
                    {bookingData.duration}h
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-border">
                  <span className="text-text font-semibold">Total</span>
                  <span className="text-primary font-bold">
                    रु {calculateTotal()}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border-2 border-error rounded-lg p-4">
                  <p className="text-text text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  disabled={loading}
                  className="flex-1 border-2 border-border text-text px-6 py-3 rounded-lg font-medium hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-success to-success/80 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
