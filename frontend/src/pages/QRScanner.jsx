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
  CreditCard,
} from "lucide-react";

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [payingFine, setPayingFine] = useState(false);
  const [finePaid, setFinePaid] = useState(false);

  const scanBooking = async (bookingId, qrData) => {
    setValidating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${bookingId}/scan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
    setFinePaid(false);
  };

  const handlePayFine = async () => {
    setPayingFine(true);
    
    // Simulate payment processing (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPayingFine(false);
    setFinePaid(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center">
          <ScanLine className="mx-auto mb-3" size={48} strokeWidth={2.5} />
          <h1 className="text-2xl font-bold">Ticket Validator</h1>
          <p className="text-blue-100 text-sm mt-1">
            Scan QR code for entry or exit
          </p>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {scanning && !validating && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-4 border-blue-500">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: "environment",
                  }}
                  components={{
                    audio: false,
                    finder: false,
                  }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-medium">Scanning...</span>
              </div>
            </div>
          )}

          {validating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2
                className="animate-spin text-blue-600"
                size={64}
                strokeWidth={2.5}
              />
              <p className="text-lg font-semibold text-gray-700">
                Validating...
              </p>
            </div>
          )}

          {result && !validating && (
            <div className="space-y-4">
              {/* Result Icon & Status */}
              <div className="flex flex-col items-center py-6">
                {result.valid ? (
                  <>
                    {result.action === "check-in" ? (
                      <LogIn
                        className="text-blue-600"
                        size={80}
                        strokeWidth={3}
                      />
                    ) : (
                      <LogOut
                        className={`${result.fine > 0 ? "text-orange-500" : "text-success"}`}
                        size={80}
                        strokeWidth={3}
                      />
                    )}
                  </>
                ) : (
                  <XCircle
                    className="text-red-500"
                    size={80}
                    strokeWidth={3}
                  />
                )}

                <h2 className="text-2xl font-bold mt-4 text-gray-800">
                  {result.action === "check-in"
                    ? "Checked In"
                    : result.action === "check-out"
                      ? "Checked Out"
                      : result.message}
                </h2>
                <p className="text-gray-600 text-sm mt-1">{result.message}</p>
              </div>

              {/* Grace Period Alert (Check-in) */}
              {result.valid &&
                result.action === "check-in" &&
                result.graceApplied && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="text-green-600" size={20} />
                      <span className="font-semibold text-green-800">
                        Grace Period Applied!
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You arrived {result.minutesLate} min late. Full duration
                      extended.
                    </p>
                  </div>
                )}

              {/* Late Warning (Check-in) */}
              {result.valid &&
                result.action === "check-in" &&
                !result.graceApplied &&
                result.minutesLate > 15 && (
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="text-orange-600" size={20} />
                      <span className="font-semibold text-orange-800">
                        Late Arrival
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      You're {result.minutesLate} min late.{" "}
                      <span className="font-semibold">
                        {result.minutesLate - 15} min lost.
                      </span>
                    </p>
                  </div>
                )}

              {/* Fine Alert (Check-out) */}
              {result.valid &&
                result.action === "check-out" &&
                result.fine > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                    <div className="font-semibold text-orange-800 text-lg mb-2">
                      ⚠️ Overstay Fine
                    </div>
                    <div className="flex items-center gap-2 text-3xl font-bold text-orange-600 mb-2">
                      <IndianRupee size={28} />
                      {result.fine}
                    </div>
                    <p className="text-sm text-orange-700 mb-1">
                      You overstayed by {result.hoursLate} hour
                      {result.hoursLate > 1 ? "s" : ""}
                    </p>
                    
                    {!finePaid ? (
                      <>
                        <p className="text-xs text-orange-600 mb-3">
                          Please pay the fine to complete check-out
                        </p>
                        <button
                          onClick={handlePayFine}
                          disabled={payingFine}
                          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          {payingFine ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard size={20} />
                              Pay Fine Now
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <CheckCircle size={20} />
                          Payment Successful!
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          You may now exit. Thank you!
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Success (Check-out, no fine) */}
              {result.valid &&
                result.action === "check-out" &&
                result.fine === 0 && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="font-semibold text-green-800">
                        Thank you!
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      No overstay charges
                    </p>
                  </div>
                )}

              {/* Booking Details */}
              {result.booking && (
                <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium text-gray-800">
                        {result.qrData?.location ||
                          result.booking.parkingSpot?.parkingLocation?.name ||
                          result.booking.location?.name ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Spot:</span>
                      <p className="font-medium text-gray-800">
                        {result.qrData?.spot ||
                          result.booking.parkingSpot?.spotNumber ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <p className="font-medium text-gray-800">
                        {result.qrData?.type ||
                          result.booking.type ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium text-gray-800">
                        {result.booking.status}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium text-gray-800">
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
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={resetScanner}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}