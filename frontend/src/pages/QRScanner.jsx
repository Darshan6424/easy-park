import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ScanLine,
  Clock,
  LogIn,
  LogOut,
  IndianRupee,
} from "lucide-react";

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  const scanBooking = async (bookingId, qrData) => {
    setValidating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${bookingId}/scan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const action = data.action; // "check-in" or "check-out"
        const booking = data.data.booking;

        setResult({
          valid: true,
          action: action,
          booking: booking,
          qrData: qrData,
          graceApplied: data.data.graceApplied,
          minutesLate: data.data.minutesLate,
          fine: data.data.fine || 0,
          hoursLate: data.data.hoursLate || 0,
          message: data.message,
        });
      } else {
        setResult({
          valid: false,
          message: data.message || "Invalid Booking",
        });
      }
    } catch (error) {
      setResult({
        valid: false,
        message: "Validation Failed",
      });
    } finally {
      setValidating(false);
      setScanning(false);
    }
  };

  const handleScan = (results) => {
    if (results && results.length > 0 && !validating) {
      try {
        const scannedData = JSON.parse(results[0].rawValue);
        console.log("QR Code Data:", scannedData);

        if (scannedData.id) {
          setScanning(false);
          scanBooking(scannedData.id, scannedData);
        }
      } catch (error) {
        console.error("QR Parse Error:", error);
        setResult({
          valid: false,
          message: "Invalid QR Code",
        });
        setScanning(false);
      }
    }
  };

  const handleError = (error) => {
    console.error("Scanner error:", error);
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text mb-2">Ticket Validator</h1>
        <p className="text-muted mb-8">Scan QR code for entry or exit</p>

        {scanning && !validating && (
          <div className="bg-surface border-2 border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="text-primary animate-pulse" size={24} />
              <p className="font-bold text-text">Scanning...</p>
            </div>
            <div className="aspect-square max-w-md mx-auto rounded-xl overflow-hidden border-4 border-primary">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{ facingMode: "environment" }}
                scanDelay={500}
              />
            </div>
          </div>
        )}

        {validating && (
          <div className="bg-surface border-2 border-border rounded-xl p-12 text-center shadow-lg">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text font-bold text-lg">Validating...</p>
          </div>
        )}

        {result && !validating && (
          <div
            className={`border-4 rounded-xl p-8 text-center shadow-2xl ${
              result.valid
                ? "bg-success/10 border-success"
                : "bg-error/10 border-error"
            }`}
          >
            {result.valid ? (
              <>
                {result.action === "check-in" ? (
                  <LogIn
                    className="text-success mx-auto mb-4"
                    size={80}
                    strokeWidth={3}
                  />
                ) : (
                  <LogOut
                    className={`mx-auto mb-4 ${result.fine > 0 ? "text-orange-500" : "text-success"}`}
                    size={80}
                    strokeWidth={3}
                  />
                )}
              </>
            ) : (
              <XCircle
                className="text-error mx-auto mb-4"
                size={80}
                strokeWidth={3}
              />
            )}

            <h2
              className={`text-3xl font-bold mb-2 ${
                result.valid ? "text-success" : "text-error"
              }`}
            >
              {result.action === "check-in"
                ? "Checked In"
                : result.action === "check-out"
                  ? "Checked Out"
                  : result.message}
            </h2>

            <p className="text-text mb-6">{result.message}</p>

            {/* Grace Period Alert (Check-in) */}
            {result.valid &&
              result.action === "check-in" &&
              result.graceApplied && (
                <div className="mb-6 p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                  <div className="flex items-center gap-3 justify-center">
                    <Clock className="text-blue-600" size={24} />
                    <div className="text-center">
                      <p className="font-bold text-blue-900">
                        Grace Period Applied!
                      </p>
                      <p className="text-sm text-blue-700">
                        You arrived {result.minutesLate} min late. Full duration
                        extended.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Late Warning (Check-in) */}
            {result.valid &&
              result.action === "check-in" &&
              !result.graceApplied &&
              result.minutesLate > 15 && (
                <div className="mb-6 p-4 rounded-lg border-2 bg-orange-50 border-orange-300">
                  <div className="flex items-center gap-3 justify-center">
                    <Clock className="text-orange-600" size={24} />
                    <div className="text-center">
                      <p className="font-bold text-orange-900">Late Arrival</p>
                      <p className="text-sm text-orange-700">
                        You're {result.minutesLate} min late.{" "}
                        {result.minutesLate - 15} min lost.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Fine Alert (Check-out) */}
            {result.valid &&
              result.action === "check-out" &&
              result.fine > 0 && (
                <div className="mb-6 p-6 rounded-lg border-4 bg-red-50 border-red-400">
                  <div className="text-center">
                    <p className="text-red-900 font-bold text-lg mb-2">
                      ⚠️ Overstay Fine
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <IndianRupee
                        className="text-red-600"
                        size={32}
                        strokeWidth={3}
                      />
                      <span className="text-red-600 font-bold text-4xl">
                        {result.fine}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">
                      You overstayed by {result.hoursLate} hour
                      {result.hoursLate > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Please pay the fine at the exit counter
                    </p>
                  </div>
                </div>
              )}

            {/* Success (Check-out, no fine) */}
            {result.valid &&
              result.action === "check-out" &&
              result.fine === 0 && (
                <div className="mb-6 p-4 rounded-lg border-2 bg-green-50 border-green-300">
                  <div className="text-center">
                    <CheckCircle
                      className="text-green-600 mx-auto mb-2"
                      size={40}
                    />
                    <p className="font-bold text-green-900">Thank you!</p>
                    <p className="text-sm text-green-700">
                      No overstay charges
                    </p>
                  </div>
                </div>
              )}

            {/* Booking Details */}
            {result.booking && (
              <div className="bg-background rounded-lg p-6 mb-6 space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-muted">Location:</span>
                  <span className="font-bold text-text">
                    {result.qrData?.location ||
                      result.booking.parkingSpot?.parkingLocation?.name ||
                      result.booking.location?.name ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Spot:</span>
                  <span className="font-bold text-text">
                    {result.qrData?.spot ||
                      result.booking.parkingSpot?.spotNumber ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Vehicle:</span>
                  <span className="font-bold text-text capitalize">
                    {result.qrData?.type || result.booking.type || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Time:</span>
                  <span className="font-bold text-text text-sm">
                    {new Date(result.booking.startTime).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}{" "}
                    -{" "}
                    {new Date(result.booking.endTime).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span
                    className={`font-bold capitalize ${
                      result.booking.status === "active"
                        ? "text-success"
                        : result.booking.status === "completed"
                          ? "text-blue-600"
                          : "text-error"
                    }`}
                  >
                    {result.booking.status}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={resetScanner}
              className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
