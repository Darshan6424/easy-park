import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
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

      if (response.ok) {
        // Handle both response formats
        const bookingsData = result.data || result.bookings || result;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="text-primary" size={20} />;
      case "completed":
        return <CheckCircle className="text-muted" size={20} />;
      case "expired":
        return <XCircle className="text-error" size={20} />;
      default:
        return <AlertCircle className="text-muted" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-primary bg-opacity-10 text-primary border-primary";
      case "completed":
        return "bg-muted bg-opacity-10 text-muted border-muted";
      case "expired":
        return "bg-error bg-opacity-10 text-error border-error";
      default:
        return "bg-muted bg-opacity-10 text-muted border-muted";
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

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error bg-opacity-10 border border-error rounded-lg p-6 text-center">
        <XCircle className="text-error mx-auto mb-2" size={48} />
        <p className="text-text font-semibold mb-2">Failed to Load Bookings</p>
        <p className="text-muted text-sm mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 m-2 md:m-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
          My Bookings
        </h2>
        <p className="text-muted">View and manage your parking reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "active", "completed", "expired"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === status
                ? "bg-primary text-white"
                : "bg-surface text-text hover:bg-border"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <MapPin className="text-muted mx-auto mb-4" size={48} />
          <p className="text-text font-semibold mb-2">No Bookings Found</p>
          <p className="text-muted">
            {filter === "all"
              ? "You haven't made any bookings yet"
              : `No ${filter} bookings`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-surface border border-border rounded-lg p-4 md:p-6 hover:border-primary transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Parking Details */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text text-lg">
                        {booking.parkingSpot?.name || "Parking Spot"}
                      </h3>
                      <p className="text-muted text-sm">
                        {booking.parkingSpot?.location || "Location"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {booking.type === "Car" ? (
                        <Car className="text-muted" size={16} />
                      ) : (
                        <Bike className="text-muted" size={16} />
                      )}
                      <span className="text-text">{booking.type}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted" size={16} />
                      <span className="text-text">
                        {formatDate(booking.startTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="text-muted" size={16} />
                      <span className="text-text">
                        {formatTime(booking.startTime)} -{" "}
                        {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status */}
                <div className="flex flex-col items-end gap-3">
                  <div
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(
                      booking.status,
                    )}`}
                  >
                    {getStatusIcon(booking.status)}
                    <span className="font-medium capitalize">
                      {booking.status}
                    </span>
                  </div>

                  {booking.status === "active" && (
                    <button className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
                      View Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
