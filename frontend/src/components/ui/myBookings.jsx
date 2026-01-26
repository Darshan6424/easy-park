import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  IndianRupee,
  Navigation,
  Trash2,
  Eye,
  RefreshCw,
  Timer,
} from "lucide-react";

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh bookings every 10 seconds to sync status changes
    const refreshInterval = setInterval(() => {
      fetchBookings();
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchBookings = async () => {
    // Only show loading on initial fetch, not on auto-refresh
    if (bookings.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("Bookings Response:", result);
      console.log(
        "Sample booking data:",
        result.data?.[0] || result.bookings?.[0],
      );

      if (response.ok) {
        const bookingsData = result.data || result.bookings || result;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        console.log("First booking raw data:", bookingsData[0]);
        console.log("parkingSpot:", bookingsData[0]?.parkingSpot);
        console.log("location:", bookingsData[0]?.location);
      } else {
        setError(result.message || "Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setDeletingId(bookingId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${bookingId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setBookings(bookings.filter((b) => b._id !== bookingId));
        alert("Booking cancelled successfully!");
      } else {
        const result = await response.json();
        alert(result.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Timer className="text-warning" size={20} strokeWidth={2.5} />
        );
      case "active":
        return (
          <CheckCircle className="text-success" size={20} strokeWidth={2.5} />
        );
      case "completed":
        return (
          <CheckCircle className="text-muted" size={20} strokeWidth={2.5} />
        );
      case "expired":
        return <XCircle className="text-error" size={20} strokeWidth={2.5} />;
      case "invalid":
        return <XCircle className="text-error" size={20} strokeWidth={2.5} />;
      case "cancelled":
        return <XCircle className="text-warning" size={20} strokeWidth={2.5} />;
      default:
        return (
          <AlertCircle className="text-muted" size={20} strokeWidth={2.5} />
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-warning/10 text-warning border-warning";
      case "active":
        return "bg-success/10 text-success border-success";
      case "completed":
        return "bg-muted/10 text-muted border-muted";
      case "expired":
        return "bg-error/10 text-error border-error";
      case "invalid":
        return "bg-error/10 text-error border-error";
      case "cancelled":
        return "bg-warning/10 text-warning border-warning";
      default:
        return "bg-muted/10 text-muted border-muted";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

const calculateDuration = (startTime, endTime, booking) => {
    if (booking?.durationHours) return booking.durationHours;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours;
  };
 
  const calculateCost = (booking) => {
    // Try to get totalCost from booking
    if (booking.totalCost && !isNaN(booking.totalCost)) {
      return booking.totalCost;
    }
 
    // Calculate from duration and rate
    const duration = calculateDuration(
      booking.startTime,
      booking.endTime,
      booking,
    );
    const hourlyRate =
      booking.hourlyRate ||
      booking.parkingSpot?.hourlyRate ||
      (booking.type?.toLowerCase() === "car" ? 50 : 30);

    return duration * hourlyRate;
  };

  const getLocationName = (booking) => {
    // Try different possible paths for location name
    return (
      booking.parkingSpot?.parkingLocation?.name ||
      booking.parkingLocation?.name ||
      booking.location?.name ||
      "Parking Location"
    );
  };

  const getSpotNumber = (booking) => {
    return booking.parkingSpot?.spotNumber || booking.spotNumber || "N/A";
  };

  const getGracePeriodStatus = (booking) => {
    // Only show grace period status for PENDING bookings (not yet checked in)
    if (booking.status?.toLowerCase() !== "pending") return null;

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = now - startTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    const GRACE_PERIOD_MINUTES = 15;

    // Not yet started
    if (minutesDiff < 0) {
      const minutesUntilStart = Math.abs(minutesDiff);
      if (minutesUntilStart <= 30) {
        return {
          type: "upcoming",
          message: `Starts in ${minutesUntilStart} min`,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-300",
        };
      }
      return null;
    }

    // Within grace period (after start time)
    if (minutesDiff >= 0 && minutesDiff <= GRACE_PERIOD_MINUTES) {
      return {
        type: "grace",
        message: `Grace period: ${GRACE_PERIOD_MINUTES - minutesDiff} min left to check in`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-300",
      };
    }

    // Beyond grace period (should be marked invalid by backend)
    if (minutesDiff > GRACE_PERIOD_MINUTES) {
      return {
        type: "expired",
        message: `Grace period expired - booking may be invalid`,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
      };
    }

    return null;
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status?.toLowerCase() === filter;
  });

  const getFilterCount = (status) => {
    if (status === "all") return bookings.length;
    return bookings.filter((b) => b.status?.toLowerCase() === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-error/10 border-2 border-error rounded-xl p-8 max-w-md text-center shadow-lg">
          <XCircle className="text-error mx-auto mb-4" size={48} />
          <p className="text-text font-bold text-lg mb-2">
            Failed to Load Bookings
          </p>
          <p className="text-muted text-sm mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text">
              My Bookings
            </h1>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="p-2 text-muted hover:text-primary transition-colors"
              title="Refresh bookings"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="text-muted">
            View and manage your parking reservations
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {["all", "pending", "active", "expired", "completed"].map((status) => {
            const count = getFilterCount(status);
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  filter === status
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                    : "bg-surface border-2 border-border text-text hover:border-primary"
                }`}
              >
                <span className="capitalize">{status}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === status
                      ? "bg-white/20"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-surface border-2 border-border rounded-xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-primary" size={40} strokeWidth={2.5} />
            </div>
            <p className="text-text font-bold text-lg mb-2">
              No Bookings Found
            </p>
            <p className="text-muted mb-6">
              {filter === "all"
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Find Parking
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => {
              const statusLower = booking.status?.toLowerCase();
              const locationName = getLocationName(booking);
              const spotNumber = getSpotNumber(booking);
              const totalCost = calculateCost(booking);
              const duration = calculateDuration(
                booking.startTime,
                booking.endTime,
              );
              const gracePeriodStatus = getGracePeriodStatus(booking);

              const canViewTicket =
                statusLower === "pending" ||
                statusLower === "active" ||
                statusLower === "expired";

              const canPayFine =
                statusLower === "expired" &&
                booking.fine > 0 &&
                !booking.finePaid;

              return (
                <div
                  key={booking._id}
                  className="bg-surface border-2 border-border rounded-xl p-5 md:p-6 hover:border-primary transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Parking Details */}
                    <div className="flex-1">
                      {/* Location Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <MapPin
                            className="text-white"
                            size={28}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-text text-lg mb-1">
                            {locationName}
                          </h3>
                          <p className="text-muted text-sm flex items-center gap-1">
                            <Navigation size={14} />
                            Spot: {spotNumber}
                          </p>
                        </div>
                      </div>

                      {/* Grace Period Alert */}
                      {gracePeriodStatus && (
                        <div
                          className={`mb-4 p-3 rounded-lg border ${gracePeriodStatus.bgColor} ${gracePeriodStatus.borderColor}`}
                        >
                          <div className="flex items-center gap-2">
                            <Timer
                              className={gracePeriodStatus.color}
                              size={18}
                              strokeWidth={2.5}
                            />
                            <p
                              className={`font-semibold text-sm ${gracePeriodStatus.color}`}
                            >
                              {gracePeriodStatus.message}
                            </p>
                          </div>
                          {gracePeriodStatus.type === "grace" && (
                            <p className="text-xs mt-1 text-orange-600">
                              💡 Scan QR at parking to start your full duration
                            </p>
                          )}
                          {gracePeriodStatus.type === "late" && (
                            <p className="text-xs mt-1 text-red-600">
                              ⚠️ You're past the 15-min grace period. Time is
                              counting down.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Booking Info Grid */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Vehicle Type */}
                        <div className="bg-background border border-border rounded-lg p-3">
                          <p className="text-xs text-muted uppercase font-semibold mb-2">
                            Vehicle
                          </p>
                          <div className="flex items-center gap-2">
                            {booking.type?.toLowerCase() === "car" ? (
                              <Car
                                className="text-primary"
                                size={20}
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Bike
                                className="text-secondary"
                                size={20}
                                strokeWidth={2.5}
                              />
                            )}
                            <span className="text-text font-bold capitalize">
                              {booking.type}
                            </span>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="bg-background border border-border rounded-lg p-3">
                          <p className="text-xs text-muted uppercase font-semibold mb-2">
                            Date
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar
                              className="text-primary"
                              size={20}
                              strokeWidth={2.5}
                            />
                            <span className="text-text font-bold text-sm">
                              {formatDate(booking.startTime)}
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="bg-background border border-border rounded-lg p-3">
                          <p className="text-xs text-muted uppercase font-semibold mb-2">
                            Time
                          </p>
                          <div className="flex items-center gap-2">
                            <Clock
                              className="text-primary"
                              size={20}
                              strokeWidth={2.5}
                            />
                            <span className="text-text font-bold text-sm">
                              {formatTime(booking.startTime)} -{" "}
                              {formatTime(booking.endTime)}
                            </span>
                          </div>
                        </div>

                        {/* Cost */}
                        <div className="bg-background border border-border rounded-lg p-3">
                          <p className="text-xs text-muted uppercase font-semibold mb-2">
                            Total Cost • {duration}h
                          </p>
                          <div className="flex items-center gap-1">
                            <IndianRupee
                              className="text-primary"
                              size={20}
                              strokeWidth={2.5}
                            />
                            <span className="text-text font-bold text-lg">
                              {totalCost}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fine Alert */}
                      {statusLower === "expired" && booking.fine > 0 && (
                        <div className={`mt-4 rounded-lg p-3 border ${
                          booking.finePaid 
                            ? "bg-green-50 border-green-200" 
                            : "bg-orange-50 border-orange-200"
                        }`}>
                          {booking.finePaid ? (
                            <>
                              <p className="text-green-700 font-semibold text-sm flex items-center gap-2">
                                <CheckCircle size={16} />
                                Fine Paid: ₹{booking.fine}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                You may now checkout at the gate.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-orange-700 font-semibold text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                Fine Due: ₹{booking.fine}
                              </p>
                              <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Checkout blocked. Click "View / Pay Fine" to pay or pay at gate.
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Time Remaining (Active only) */}
                      {booking.status?.toLowerCase() === "active" &&
                        !gracePeriodStatus && (
                          <div className="mt-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-lg p-3">
                            <p className="text-success font-semibold text-sm flex items-center gap-2">
                              <Clock size={16} strokeWidth={2.5} />
                              {getTimeRemaining(booking.endTime)}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col gap-3 lg:items-end">
                      {/* Status Badge */}
                      <div
                        className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 ${getStatusColor(
                          booking.status,
                        )} shadow-sm`}
                      >
                        {getStatusIcon(booking.status)}
                        <span className="font-bold capitalize text-sm">
                          {booking.status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {canViewTicket && (
                          <button
                            onClick={() => navigate(`/booking/${booking._id}`)}
                            className="flex-1 lg:flex-none bg-gradient-to-r from-primary to-accent text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center gap-2"
                          >
                            <Eye size={16} />
                            {statusLower === "pending"
                              ? "View Ticket"
                              : statusLower === "expired"
                              ? "View / Pay Fine"
                              : "View Ticket"}
                          </button>
                        )}

                        {statusLower === "pending" && (
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            disabled={deletingId === booking._id}
                            className="px-4 py-2.5 bg-error/10 border-2 border-error/30 text-error rounded-lg hover:bg-error/20 transition-all font-medium disabled:opacity-50 flex items-center justify-center"
                            title="Cancel booking"
                          >
                            {deletingId === booking._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} strokeWidth={2.5} />
                            )}
                          </button>
                        )}

                        {statusLower === "completed" && (
                          <button
                            onClick={() => navigate(`/booking/${booking._id}`)}
                            className="flex-1 lg:flex-none bg-background border-2 border-border text-text px-5 py-2.5 rounded-lg hover:border-primary transition-all font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
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
