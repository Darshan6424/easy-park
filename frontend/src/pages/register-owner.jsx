import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Upload,
  FileText,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getUser, setUser } from "../utils/auth.js";

export default function RegisterOwner() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    idProof: null,
    addressProof: null,
    businessDoc: null,
    acceptTerms: false,
  });

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    if (!formData.idProof || !formData.addressProof) {
      setError("Please upload all required documents");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to become a parking spot owner? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ role: "OWNER" }),
        },
      );

      const result = await response.json();
      console.log("Promote Response:", result);

      if (response.ok) {
        setUser(result.data);
        alert("Congratulations! You are now a parking spot owner! 🎉");
        navigate("/profile");
      } else {
        setError(result.message || "Failed to promote account");
      }
    } catch (err) {
      console.error("Promote error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="text-muted hover:text-primary mb-6 flex items-center gap-2 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to Profile
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-xl p-6 md:p-8 mb-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Become a Parking Owner
              </h1>
              <p className="text-white/90">
                Complete the verification process to start listing your parking
                spaces
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="text-accent flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-text font-semibold text-sm mb-1">
              Demo Verification Process
            </p>
            <p className="text-muted text-xs">
              This is a demonstration of document verification. In production,
              these documents would be verified by our team for security and
              authenticity.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Document Upload Section */}
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              Identity Verification
            </h2>

            <div className="space-y-6">
              {/* ID Proof */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Government ID Proof *
                  <span className="text-muted font-normal ml-2">
                    (Passport, Driver's License, National ID)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "idProof")}
                    className="hidden"
                    id="idProof"
                  />
                  <label
                    htmlFor="idProof"
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-background border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <Upload
                      size={20}
                      className="text-muted group-hover:text-primary transition-colors"
                    />
                    <span className="text-sm text-text">
                      {formData.idProof
                        ? formData.idProof.name
                        : "Click to upload ID proof"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Address Proof */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Address Proof *
                  <span className="text-muted font-normal ml-2">
                    (Utility Bill, Bank Statement, Lease Agreement)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "addressProof")}
                    className="hidden"
                    id="addressProof"
                  />
                  <label
                    htmlFor="addressProof"
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-background border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <Upload
                      size={20}
                      className="text-muted group-hover:text-primary transition-colors"
                    />
                    <span className="text-sm text-text">
                      {formData.addressProof
                        ? formData.addressProof.name
                        : "Click to upload address proof"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Business Documentation (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Business Documentation (Optional)
                  <span className="text-muted font-normal ml-2">
                    (Business License, Property Ownership)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "businessDoc")}
                    className="hidden"
                    id="businessDoc"
                  />
                  <label
                    htmlFor="businessDoc"
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-background border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <Upload
                      size={20}
                      className="text-muted group-hover:text-primary transition-colors"
                    />
                    <span className="text-sm text-text">
                      {formData.businessDoc
                        ? formData.businessDoc.name
                        : "Click to upload business documents"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-text mb-4">
              Terms & Conditions
            </h2>

            <div className="bg-background border border-border rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
              <div className="text-sm text-muted space-y-3">
                <p>
                  <strong className="text-text">
                    1. Owner Responsibilities
                  </strong>
                  <br />
                  As a parking owner, you are responsible for maintaining
                  accurate information about your parking spaces, ensuring
                  availability matches your listings, and providing safe access
                  to customers.
                </p>
                <p>
                  <strong className="text-text">2. Payment Terms</strong>
                  <br />
                  Payments will be processed according to our payment schedule.
                  Platform fees and commissions apply as per the pricing
                  structure.
                </p>
                <p>
                  <strong className="text-text">
                    3. Liability & Insurance
                  </strong>
                  <br />
                  Owners are responsible for maintaining appropriate insurance
                  coverage for their parking facilities and comply with local
                  regulations.
                </p>
                <p>
                  <strong className="text-text">4. Quality Standards</strong>
                  <br />
                  All parking spaces must meet our quality and safety standards.
                  Regular inspections may be conducted.
                </p>
                <p>
                  <strong className="text-text">5. Account Termination</strong>
                  <br />
                  We reserve the right to suspend or terminate owner accounts
                  that violate our terms or provide poor service quality.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTerms: e.target.checked })
                }
                className="w-5 h-5 mt-0.5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-text group-hover:text-primary transition-colors">
                I have read and agree to the Terms and Conditions. I understand
                that I am responsible for maintaining my parking facilities and
                complying with all applicable laws and regulations.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border-2 border-error rounded-xl p-4">
              <p className="text-text text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex-1 border-2 border-border text-text px-6 py-4 rounded-lg font-semibold hover:border-primary hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-secondary to-secondary/80 text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Become an Owner
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
