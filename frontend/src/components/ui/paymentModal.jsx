import { useState } from "react";
import { X, CreditCard, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!booking) return null;

  const calculateOverstay = () => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    const diff = now - endTime;
    
    if (diff <= 0) return { hours: 0, minutes: 0 };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const overstay = calculateOverstay();
  const fineAmount = booking.currentFine || booking.fine || 0;
  const hourlyRate = booking.hourlyRate || 50;

  const handlePayFine = async () => {
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/booking/${booking._id}/pay-fine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(result.data);
        }, 2000);
      } else {
        setError(result.message || "Failed to process payment");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface border-2 border-border rounded-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Payment Successful!</h2>
          <p className="text-muted mb-4">
            Fine of ₹{fineAmount} has been paid.
          </p>
          <p className="text-sm text-muted">
            You may now checkout by scanning QR at the gate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border-2 border-border rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pay Fine</h2>
              <p className="text-white/80 text-sm">Demo Payment</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Overstay Details */}
          <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-warning" />
              <h3 className="font-bold text-text">Overstay Duration</h3>
            </div>
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-warning">
                {overstay.hours}h {overstay.minutes}m
              </p>
              <p className="text-sm text-muted mt-1">Extra time beyond booking</p>
            </div>
          </div>

          {/* Fine Breakdown */}
          <div className="bg-background border-2 border-border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-text mb-2">Fine Breakdown</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted">Hourly Rate:</span>
              <span className="font-semibold text-text">₹{hourlyRate}/hr</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted">Fine Rate:</span>
              <span className="font-semibold text-text">₹{Math.ceil(hourlyRate * 1.5)}/hr (1.5x)</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted">Hours Late:</span>
              <span className="font-semibold text-text">
                {Math.ceil((overstay.hours * 60 + overstay.minutes) / 60)} hour(s)
              </span>
            </div>
            
            <div className="border-t-2 border-border pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text">Total Fine:</span>
                <span className="text-3xl font-bold text-error">₹{fineAmount}</span>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-text">
                <p className="font-semibold mb-1">After Payment:</p>
                <p className="text-muted">
                  Your fine will be marked as paid and the spot will remain reserved. 
                  Scan QR at the gate to complete checkout and free the spot.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border-2 border-error rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-background border-2 border-border rounded-lg font-semibold hover:border-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayFine}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{fineAmount}
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-muted">
            This is a demo payment. No actual transaction will occur.
          </p>
        </div>
      </div>
    </div>
  );
}
