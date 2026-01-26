import { useEffect, useState } from "react";
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
import { useSearchParams } from "react-router-dom";
import { getUser } from "../utils/auth.js";

export default function QRScannerPage() {
  const [searchParams] = useSearchParams();
  const user = getUser();

  const [scanning, setScanning] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [payingFine, setPayingFine] = useState(false);
  const [finePaid, setFinePaid] = useState(false);
  const [ownerLocations, setOwnerLocations] = useState([]);
  const [activeLocationId, setActiveLocationId] = useState(
    searchParams.get("locationId") || ""
  );
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const fetchOwnerLocations = async () => {
    setLocationsLoading(true);
    setLocationError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location?ownerOnly=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok) {
        const locations = data.data || data.locations || [];
        const parsed = Array.isArray(locations) ? locations : [];
        setOwnerLocations(parsed);

        if (!activeLocationId && parsed.length === 1) {
          setActiveLocationId(parsed[0]._id);
        }
      } else {
        setLocationError(data.message || "Could not load locations");
      }
    } catch (error) {
      setLocationError("Network error while loading locations");
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "OWNER" || user?.role === "ADMIN") {
      fetchOwnerLocations();
    }
  }, [user?.role]);

  const scanBooking = async (bookingId, qrData) => {
    setValidating(true);
    const locationForScan = activeLocationId || qrData.locationId;

    // Allow admin@test.com to scan without selecting location
    const isMegaAdmin = user?.email === "admin@test.com";
    
    if (!locationForScan && !isMegaAdmin) {
      setResult({
        valid: false,
        message: "Select a location before scanning",
      });
      setValidating(false);
      setScanning(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${bookingId}/scan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ locationId: locationForScan || null }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const requiresFinePayment = data.data?.requiresFinePayment;
        const action = data.action || "check-out";
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
          requiresFinePayment: requiresFinePayment,
          message: data.message,
        });
        setFinePaid(!requiresFinePayment);
      } else {
        // Handle error response (e.g., fine payment required)
        const requiresFinePayment = data.data?.requiresFinePayment;
        const action = data.action || "error";

        if (action === "fine-payment-required" || requiresFinePayment) {
          setResult({
            valid: false,
            action: "fine-payment-required",
            booking: data.data?.booking,
            qrData: qrData,
            fine: data.data?.fine || 0,
            hoursLate: data.data?.hoursLate || 0,
            minutesLate: data.data?.minutesLate || 0,
            requiresFinePayment: true,
            message: data.message || "Fine payment required before checkout",
          });
          setFinePaid(false);
        } else {
          setResult({
            valid: false,
            message: data.message || "Invalid Booking",
          });
        }
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
        const scannedData = results[0].rawValue;
        console.log("QR Code Data:", scannedData);

        // QR code now contains just the booking ID
        if (scannedData && scannedData.length === 24) { // MongoDB ObjectId length
          setScanning(false);
          scanBooking(scannedData, { id: scannedData });
        } else {
          throw new Error("Invalid booking ID format");
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
    if (!result?.booking?._id) return;

    const isMegaAdmin = user?.email === "admin@test.com";
    const locationForScan = activeLocationId || result.qrData?.locationId;
    
    if (!locationForScan && !isMegaAdmin) {
      setResult((prev) => ({
        ...prev,
        valid: false,
        message: "Select a location before paying the fine",
      }));
      return;
    }

    setPayingFine(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${result.booking._id}/pay-fine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ locationId: locationForScan || null }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        // Fine paid successfully, now trigger checkout
        const checkoutResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/booking/${result.booking._id}/checkout-after-fine`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ locationId: locationForScan || null }),
          }
        );

        const checkoutData = await checkoutResponse.json();
        
        if (checkoutResponse.ok && checkoutData.success) {
          setFinePaid(true);
          setResult((prev) => ({
            ...prev,
            valid: true,
            action: "check-out",
            booking: checkoutData.data?.booking || prev.booking,
            fine: checkoutData.data?.fine ?? prev.fine,
            minutesLate: checkoutData.data?.minutesLate ?? prev.minutesLate,
            hoursLate: checkoutData.data?.hoursLate ?? prev.hoursLate,
            requiresFinePayment: false,
            message: checkoutData.message || "Payment successful. Checkout completed.",
          }));
        } else {
          // Payment successful but checkout failed
          setFinePaid(true);
          setResult((prev) => ({
            ...prev,
            valid: true,
            action: "fine-paid",
            booking: data.data?.booking || prev.booking,
            requiresFinePayment: false,
            message: "Fine paid. Please scan again to complete checkout.",
          }));
        }
      } else {
        setResult((prev) => ({
          ...prev,
          valid: false,
          message: data.message || "Fine payment failed",
        }));
      }
    } catch (error) {
      setResult((prev) => ({
        ...prev,
        valid: false,
        message: "Network error processing fine",
      }));
    } finally {
      setPayingFine(false);
    }
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
          {user?.email === "admin@test.com" && (
            <div className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle size={16} strokeWidth={2.5} />
                <span>Mega Admin Access - All Locations Enabled</span>
              </div>
            </div>
          )}
          
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Scan Location {user?.email === "admin@test.com" && <span className="text-xs text-gray-500">(Optional)</span>}
              </label>
              {locationsLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="animate-spin" size={14} /> Loading...
                </div>
              )}
            </div>

            {ownerLocations.length > 0 ? (
              <select
                value={activeLocationId}
                onChange={(e) => setActiveLocationId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a location</option>
                {ownerLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-500">
                The scanner will use the location embedded in the QR code.
              </p>
            )}

            {locationError && (
              <p className="text-xs text-red-600">{locationError}</p>
            )}

            {!activeLocationId && result?.qrData?.location && (
              <p className="text-xs text-gray-600">
                QR Location: {result.qrData.location}
              </p>
            )}
          </div>

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
                    ) : result.action === "fine-payment-required" || result.requiresFinePayment ? (
                      <CreditCard
                        className="text-orange-500"
                        size={80}
                        strokeWidth={3}
                      />
                    ) : result.action === "fine-paid" ? (
                      <CheckCircle
                        className="text-green-600"
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
                  <>
                    {result.action === "fine-payment-required" ? (
                      <CreditCard
                        className="text-orange-500"
                        size={80}
                        strokeWidth={3}
                      />
                    ) : (
                      <XCircle
                        className="text-red-500"
                        size={80}
                        strokeWidth={3}
                      />
                    )}
                  </>
                )}

                <h2 className="text-2xl font-bold mt-4 text-gray-800">
                  {result.action === "check-in"
                    ? "Checked In"
                    : result.action === "fine-payment-required"
                      ? "⚠️ Fine Payment Required"
                      : result.action === "fine-paid"
                        ? "Fine Paid Successfully"
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

              {/* Fine Alert (Check-out or Payment Required) */}
              {(result.action === "fine-payment-required" || 
                (result.requiresFinePayment && !result.valid)) &&
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
                    
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                      <p className="text-sm text-red-800 font-semibold">
                        🚫 Checkout Blocked
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Fine must be paid before vehicle can exit
                      </p>
                    </div>
                    
                    {!finePaid ? (
                      <>
                        <p className="text-xs text-orange-600 mb-3">
                          Click below to process payment and complete checkout
                        </p>
                        <button
                          onClick={handlePayFine}
                          disabled={
                            payingFine ||
                            !(activeLocationId || result.qrData?.locationId)
                          }
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
                              Pay Fine & Complete Checkout
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
                          Checkout completed. You may now exit. Thank you!
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Fine Alert (Valid checkout with fine) */}
              {result.valid &&
                result.action !== "fine-payment-required" &&
                result.requiresFinePayment &&
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
                        disabled={
                          payingFine ||
                          !(activeLocationId || result.qrData?.locationId)
                        }
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