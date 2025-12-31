import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Car,
  Bike,
  Calendar,
  Clock,
  Navigation,
  IndianRupee,
  ChevronLeft,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Timer,
} from "lucide-react";
import generateQr from "../lib/qrCodeGenerator";

export default function BookingTicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (booking && qrRef.current && !qrCode) {
      const ticketData = JSON.stringify({
        id: booking._id,
        spot: booking.parkingSpot?.spotNumber,
        location: getLocationName(),
        start: booking.startTime,
        end: booking.endTime,
        type: booking.type,
        cost: calculateTotalCost(),
        status: booking.status,
      });
      console.log(ticketData);
      const qr = generateQr(ticketData);
      qr.append(qrRef.current);
      setQrCode(qr);
    }
  }, [booking, qrCode]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${bookingId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("Booking Response:", result);

      if (response.ok) {
        const bookingData = result.data || result;
        setBooking(bookingData);
      } else {
        setError(result.message || "Failed to fetch booking");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = () => {
    return (
      booking?.parkingSpot?.parkingLocation?.name ||
      booking?.location?.name ||
      "Parking Location"
    );
  };

  const calculateDuration = () => {
    if (!booking) return 0;
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    return hours;
  };

  const getHourlyRate = () => {
    // Try to get rate from location
    const rate =
      booking?.parkingSpot?.parkingLocation?.cost ||
      booking?.location?.cost ||
      (booking?.type?.toLowerCase() === "car" ? 50 : 30);
    return rate;
  };

  const calculateTotalCost = () => {
    if (!booking) return 0;

    // If totalCost is already stored, use it
    if (booking.totalCost && !isNaN(booking.totalCost)) {
      return booking.totalCost;
    }

    // Otherwise calculate: duration × hourly rate
    const duration = calculateDuration();
    const rate = getHourlyRate();
    return duration * rate;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (!booking || booking.status !== "active") return null;

    const now = new Date();
    const end = new Date(booking.endTime);
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDownload = () => {
    if (qrCode) {
      qrCode.download({
        name: `parking-ticket-${booking._id}`,
        extension: "png",
      });
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-error/10 border-2 border-error rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="text-error mx-auto mb-4" size={48} />
          <p className="text-text font-bold text-lg mb-2">
            Unable to Load Ticket
          </p>
          <p className="text-muted text-sm mb-4">
            {error || "Booking not found"}
          </p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();
  const isActive = booking.status?.toLowerCase() === "active";
  const duration = calculateDuration();
  const hourlyRate = getHourlyRate();
  const totalCost = calculateTotalCost();

  return (
    <div className="min-h-screen bg-background py-6 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header - Hidden when printing */}
        <div className="mb-6 print:hidden">
          <button
            onClick={() => navigate("/my-bookings")}
            className="text-muted hover:text-primary mb-4 flex items-center gap-2 transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Back to Bookings
          </button>
        </div>

        {/* Ticket Card - Compact Size */}
        <div className="bg-white border-2 border-border rounded-xl overflow-hidden shadow-xl ticket-container">
          {/* Ticket Header - Compact */}
          <div className="bg-gradient-to-r from-primary via-accent to-primary p-4 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)",
                }}
              />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <MapPin size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Parking Ticket</h1>
                    <p className="text-white/80 text-xs">
                      #{booking._id?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {isActive && timeRemaining && (
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Timer size={14} />
                      <span className="font-bold text-xs">{timeRemaining}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs ${
                    isActive
                      ? "bg-success/20 border border-success/30 text-white"
                      : "bg-white/20 border border-white/30 text-white"
                  }`}
                >
                  <CheckCircle size={12} strokeWidth={2.5} />
                  <span className="capitalize">{booking.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Perforated Edge Effect */}
          <div className="h-4 bg-white relative">
            <div className="absolute inset-x-0 top-0 flex justify-between px-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 -mt-1 bg-background rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Ticket Body - Responsive Grid */}
          <div className="p-4">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
              {/* Left Side - Details */}
              <div className="space-y-3">
                {/* Location */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">
                    Location
                  </p>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin
                        className="text-primary"
                        size={16}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-text text-sm leading-tight">
                        {getLocationName()}
                      </p>
                      <p className="text-muted text-xs flex items-center gap-1 mt-0.5">
                        <Navigation size={10} />
                        Spot {booking.parkingSpot?.spotNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-surface border border-border rounded-lg p-2">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1.5">
                    Vehicle
                  </p>
                  <div className="flex items-center gap-2">
                    {booking.type?.toLowerCase() === "car" ? (
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Car
                          className="text-primary"
                          size={18}
                          strokeWidth={2.5}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Bike
                          className="text-secondary"
                          size={18}
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                    <p className="font-bold text-text text-sm capitalize">
                      {booking.type}
                    </p>
                  </div>
                </div>

                {/* Date & Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface border border-border rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar
                        className="text-primary"
                        size={12}
                        strokeWidth={2.5}
                      />
                      <p className="text-xs font-bold text-muted uppercase">
                        Date
                      </p>
                    </div>
                    <p className="font-bold text-text text-xs leading-tight">
                      {formatDate(booking.startTime)}
                    </p>
                  </div>

                  <div className="bg-surface border border-border rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock
                        className="text-primary"
                        size={12}
                        strokeWidth={2.5}
                      />
                      <p className="text-xs font-bold text-muted uppercase">
                        Duration
                      </p>
                    </div>
                    <p className="font-bold text-text text-xs">{duration}h</p>
                  </div>
                </div>

                {/* Time Slot */}
                <div className="bg-surface border border-border rounded-lg p-2">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1.5">
                    Time Slot
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-muted text-xs mb-0.5">Start</p>
                      <p className="font-bold text-text">
                        {formatTime(booking.startTime)}
                      </p>
                    </div>
                    <div className="flex-1 mx-2 border-t border-dashed border-border" />
                    <div className="text-right">
                      <p className="text-muted text-xs mb-0.5">End</p>
                      <p className="font-bold text-text">
                        {formatTime(booking.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-2">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">
                    Amount Paid
                  </p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <IndianRupee
                      className="text-primary"
                      size={20}
                      strokeWidth={2.5}
                    />
                    <span className="text-primary font-bold text-2xl">
                      {totalCost}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    रु {hourlyRate}/hr × {duration} hour{duration > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Right Side - QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-surface border border-border rounded-lg p-3 text-center w-full">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
                    Scan QR Code
                  </p>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-lg border-2 border-primary inline-block mb-2">
                    <div ref={qrRef} className="qr-code-wrapper" />
                  </div>

                  <p className="text-xs text-muted">Present at entry/exit</p>
                </div>

                {/* Booking ID */}
                <div className="mt-3 text-center w-full">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">
                    Booking ID
                  </p>
                  <p className="font-mono font-bold text-text bg-surface px-2 py-1 rounded border border-border text-xs break-all">
                    {booking._id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer - Compact */}
          <div className="bg-surface border-t border-border p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted text-center sm:text-left">
                <strong>Note:</strong> Arrive on time. Late arrivals may result
                in spot unavailability.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-background border border-border text-text rounded-lg hover:border-primary transition-all font-medium text-xs flex items-center gap-1.5"
                >
                  <Download size={14} strokeWidth={2.5} />
                  QR
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all font-bold text-xs"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {isActive && (
          <div className="mt-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-lg p-3 print:hidden">
            <div className="flex items-start gap-2">
              <CheckCircle
                className="text-success flex-shrink-0 mt-0.5"
                size={16}
                strokeWidth={2.5}
              />
              <div>
                <p className="font-bold text-text text-sm mb-0.5">
                  Active Booking
                </p>
                <p className="text-xs text-muted">
                  Your parking spot is reserved and ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .qr-code-wrapper {
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code-wrapper svg,
        .qr-code-wrapper canvas {
          max-width: 100%;
          max-height: 100%;
          width: 220px !important;
          height: 220px !important;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          
          html, body {
            height: 100%;
            overflow: hidden;
          }
          
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          body * {
            visibility: hidden;
          }
          
          .ticket-container,
          .ticket-container * {
            visibility: visible;
          }
          
          .ticket-container {
            position: fixed !important;
            left: 50%;
            top: 0;
            transform: translateX(-50%) scale(0.92);
            transform-origin: top center;
            max-width: 700px;
            width: 100%;
            box-shadow: none !important;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          
          .ticket-container::after {
            content: '';
            display: block;
            page-break-after: always;
          }
          
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
