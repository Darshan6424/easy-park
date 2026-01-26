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
  CreditCard,
  Bell,
  BellOff,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import generateQr from "../lib/qrCodeGenerator";
import { useBookingNotifications } from "../hooks/useBookingNotifications";
import { 
  requestNotificationPermission, 
  areNotificationsEnabled 
} from "../utils/notifications";
import PaymentModal from "../components/ui/paymentModal";

export default function BookingTicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const ticketRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Setup notification system for this booking
  useBookingNotifications(booking);

  // Update current time every second for dynamic display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check notification permission status
  useEffect(() => {
    setNotificationsEnabled(areNotificationsEnabled());
  }, []);

  useEffect(() => {
    fetchBooking();
    
    // Reduced auto-refresh: Only for critical status changes
    const refreshInterval = setInterval(() => {
      if (!booking) return;
      
      // Only auto-refresh for active statuses
      if (booking.status === "pending" || booking.status === "active") {
        fetchBooking();
      }
    }, 30000); // Refresh every 30 seconds (reduced from 5s to prevent flicker)
    
    return () => clearInterval(refreshInterval);
  }, [booking?.status, bookingId]);

  // Generate QR code once when booking is loaded
  useEffect(() => {
    if (booking && qrRef.current && !qrCode) {
      // Simple QR data - just the booking ID for demo
      const qrData = booking._id;
      
      const qr = generateQr(qrData);
      qr.append(qrRef.current);
      setQrCode(qr);
    }
  }, [booking?._id, qrCode]); // Only depend on booking ID, not entire booking object


  const fetchBooking = async () => {
    // Only show loading on initial fetch, not on auto-refresh
    const isInitialFetch = !booking;
    if (isInitialFetch) {
      setLoading(true);
    }
    
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

      if (response.ok) {
        const bookingData = result.data || result;
        
        // Only update state if critical data has changed (prevents flicker)
        if (!booking || 
            booking.status !== bookingData.status || 
            booking.fine !== bookingData.fine ||
            booking.finePaid !== bookingData.finePaid ||
            booking.attemptedCheckout !== bookingData.attemptedCheckout) {
          setBooking(bookingData);
        }
      } else {
        setError(result.message || "Failed to fetch booking");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (isInitialFetch) {
        setError("Network error. Please try again.");
      }
    } finally {
      // Only clear loading if this was an initial fetch
      if (isInitialFetch) {
        setLoading(false);
      }
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
    if (booking.durationHours) return booking.durationHours;
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    return hours;
  };
 
  const getHourlyRate = () => {
    // Try to get rate from booking first
    const rate =
      booking?.hourlyRate ||
      (booking?.type?.toLowerCase() === "car" ? 50 : 30);
    return rate;
  };

  const calculateTotalCost = () => {
    if (!booking) return 0;

    // Prefer pre-calculated value
    if (booking.totalCost && !isNaN(booking.totalCost)) {
      return booking.totalCost;
    }

    // Fallback calculation
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
    if (!booking) return null;

    // For pending, show time until grace period expires
    if (booking.status === "pending") {
      const now = new Date();
      const startTime = new Date(booking.startTime);
      const GRACE_PERIOD_MINUTES = 15;
      
      // Grace period ends 15 minutes after start time
      const graceExpiry = new Date(startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000);
      
      // If we're before the start time, show time until start
      if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `Starts in ${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
          return `Starts in ${minutes}m`;
        }
        return "Starting soon";
      }
      
      // We're past start time, show grace period countdown
      const diff = graceExpiry - now;

      if (diff <= 0) return "Grace Expired";

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (minutes > 0) {
        return `${minutes}m ${seconds}s to check in`;
      }
      return `${seconds}s to check in`;
    }

    // For active bookings, show time until end
    if (booking.status !== "active") return null;

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

  const handlePayFine = () => {
    if (!booking?.attemptedCheckout) {
      alert("You must scan QR at the gate first before paying fine online. This prevents paying fines remotely.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (updatedBooking) => {
    setBooking(updatedBooking.booking || updatedBooking);
    setShowPaymentModal(false);
    // Refresh booking to get latest data
    setTimeout(() => fetchBooking(), 1000);
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || isDownloadingPDF) return;
    
    setIsDownloadingPDF(true);
    
    try {
      // Capture the ticket element as canvas
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename with booking details
      const filename = `parking-ticket-${booking?.parkingSpot?.spotNumber || 'ticket'}-${new Date().getTime()}.pdf`;
      
      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Unable to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      alert("Notifications enabled! You'll receive updates about your booking.");
    } else {
      alert("Notification permission denied. You can enable it from browser settings.");
    }
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
  const isPending = booking.status?.toLowerCase() === "pending";
  const isInvalid = booking.status?.toLowerCase() === "invalid";
  const hasExpired = booking.status?.toLowerCase() === "expired";
  const isCheckedOut = booking.isCheckedOut;
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

          {/* Notification Status */}
          {(isPending || isActive) && !notificationsEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-3">
                <BellOff className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Enable Notifications
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    Get notified when your booking starts, grace period is ending, and more.
                  </p>
                  <button
                    onClick={handleEnableNotifications}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Enable Notifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {(isPending || isActive) && notificationsEnabled && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <Bell size={16} />
                <span className="font-medium">Notifications enabled - You'll receive timely updates</span>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Card - Compact Size */}
        <div ref={ticketRef} className="bg-white border-2 border-border rounded-xl overflow-hidden shadow-xl ticket-container">
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

                {(isActive || isPending) && timeRemaining && (
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
                    isPending
                      ? "bg-warning/20 border border-warning/30 text-white"
                      : isActive
                        ? "bg-success/20 border border-success/30 text-white"
                        : isInvalid
                          ? "bg-error/20 border border-error/30 text-white"
                          : "bg-white/20 border border-white/30 text-white"
                  }`}
                >
                  {isPending ? (
                    <Timer size={12} strokeWidth={2.5} />
                  ) : (
                    <CheckCircle size={12} strokeWidth={2.5} />
                  )}
                  <span className="capitalize">
                    {booking.status?.replace("-", " ")}
                  </span>
                </div>
              </div>

              {isPending && (
                <div className="mt-3 bg-white/20 border border-white/40 rounded-lg px-3 py-2 text-xs text-white">
                  {(() => {
                    const now = new Date();
                    const startTime = new Date(booking.startTime);
                    const GRACE_PERIOD_MINUTES = 15;
                    const graceExpiry = new Date(startTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000);
                    
                    if (now < startTime) {
                      // Future booking
                      return (
                        <>
                          <strong>Future Booking:</strong> Your booking starts at{" "}
                          {formatTime(booking.startTime)}. You can check in up to 15 minutes before start time.
                        </>
                      );
                    } else if (now >= startTime && now <= graceExpiry) {
                      // In grace period
                      return (
                        <>
                          <strong>Check in required!</strong> Scan this QR at the
                          parking location within {timeRemaining || "15 minutes"} to
                          activate your booking.
                        </>
                      );
                    } else {
                      // Grace expired
                      return (
                        <>
                          <strong>Grace period expired!</strong> Your booking may be
                          marked as invalid. Please contact support.
                        </>
                      );
                    }
                  })()}
                </div>
              )}
              {isInvalid && (
                <div className="mt-3 bg-white/20 border border-white/40 rounded-lg px-3 py-2 text-xs text-white">
                  <strong>Booking Invalid:</strong> Grace period expired. You
                  did not check in within 15 minutes of booking start time.
                </div>
              )}
              {hasExpired && !isCheckedOut && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs">
                  <div className="font-semibold text-orange-800 mb-1">
                    ⚠️ Booking Expired
                  </div>
                  {booking.fine > 0 && !booking.finePaid ? (
                    <div className="text-orange-700">
                      <p className="mb-1">
                        <strong>Fine Amount:</strong> ₹{booking.fine}
                      </p>
                      {booking.attemptedCheckout ? (
                        <p className="text-xs">
                          Fine detected! Use "Pay Fine" button below to pay online, or pay at exit gate.
                        </p>
                      ) : (
                        <p className="text-xs bg-yellow-100 border border-yellow-300 rounded p-2 mt-1">
                          <strong>⚠️ Scan QR at gate first:</strong> You must attempt checkout at the exit gate before you can pay the fine online. This prevents remote fine payments.
                        </p>
                      )}
                    </div>
                  ) : booking.finePaid ? (
                    <p className="text-green-700 font-semibold">
                      ✓ Fine paid. You may checkout at the gate.
                    </p>
                  ) : (
                    <p className="text-orange-700">
                      Booking time ended. Scan QR at gate to checkout.
                    </p>
                  )}
                </div>
              )}
              {booking.fine > 0 && !booking.finePaid && hasExpired && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-semibold">
                  ⚠️ Checkout blocked until fine is paid: ₹{booking.fine}
                </div>
              )}
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
                {hasExpired && booking.fine > 0 && !booking.finePaid && booking.attemptedCheckout && (
                  <button
                    onClick={handlePayFine}
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-bold text-xs flex items-center gap-1.5"
                  >
                    <CreditCard size={14} strokeWidth={2.5} />
                    Pay Fine ₹{booking.fine}
                  </button>
                )}
                {hasExpired && booking.finePaid && (
                  <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle size={14} strokeWidth={2.5} />
                    Fine Paid
                  </div>
                )}
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-background border border-border text-text rounded-lg hover:border-primary transition-all font-medium text-xs flex items-center gap-1.5"
                >
                  <Download size={14} strokeWidth={2.5} />
                  QR
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingPDF ? (
                    <>
                      <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} strokeWidth={2.5} />
                      Download PDF
                    </>
                  )}
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
      `}</style>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
