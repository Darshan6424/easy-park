import { useState, useEffect } from "react";
import {
  User,
  Mail,
  MapPin,
  Smartphone,
  Save,
  Edit2,
  X,
  Trash2,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUser, setUser, logout } from "../utils/auth.js";

export default function Profile() {
  const navigate = useNavigate();
  const user = getUser();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Only send changed fields
    const updates = {};
    if (formData.fullName !== user.fullName)
      updates.fullName = formData.fullName;
    if (formData.email !== user.email) updates.email = formData.email;
    if (formData.address !== user.address) updates.address = formData.address;

    if (Object.keys(updates).length === 0) {
      setError("No changes to save");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updates),
        },
      );

      const result = await response.json();
      console.log("Update Response:", result);

      if (response.ok) {
        setUser(result.data); // Use returned data from backend
        setSuccess(result.message || "Profile updated successfully!");
        setIsEditing(false);
      } else {
        setError(result.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToOwner = async () => {
    if (
      !confirm(
        "Are you sure you want to become a parking spot owner? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

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
        setUser(result.data); // Use returned data from backend
        setSuccess(result.message || "You are now a parking spot owner!");
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

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("Delete Response:", result);

      if (response.ok) {
        logout();
        navigate("/");
      } else {
        setError(result.message || "Failed to delete account");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            My Profile
          </h1>
          <p className="text-muted">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-lg p-6 md:p-8 mb-6">
          {/* Avatar & Role */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <User className="text-background" size={40} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text">{user.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === "OWNER"
                      ? "bg-accent bg-opacity-10 text-background"
                      : "bg-primary bg-opacity-10 text-background"
                  }`}
                >
                  {user.role}
                </div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted hover:text-text transition-colors"
              >
                <Edit2 size={20} />
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Device ID (read-only) */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Device ID
              </label>
              <div className="relative">
                <Smartphone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="text"
                  value={user.deviceId || "N/A"}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-muted cursor-not-allowed"
                />
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      fullName: user.fullName,
                      email: user.email,
                      address: user.address,
                    });
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                  className="px-6 py-3 border border-border text-text rounded-lg hover:bg-border transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="bg-error bg-opacity-10 border border-error rounded-lg p-3">
                <p className="text-text text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-primary bg-opacity-10 border border-primary rounded-lg p-3">
                <p className="text-background text-sm">{success}</p>
              </div>
            )}
          </div>
        </div>

        {/* Promote to Owner */}
        {user.role !== "OWNER" && (
          <div className="bg-surface border-2 border-secondary rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text mb-2">
                  Become a Parking Owner
                </h3>
                <p className="text-muted text-sm mb-4">
                  Upgrade your account to list and manage your own parking
                  locations. Start earning by renting out your parking spaces.
                </p>
                <button
                  onClick={handlePromoteToOwner}
                  disabled={loading}
                  className="bg-secondary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Upgrade to Owner"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-surface border-2 border-error rounded-lg p-6">
          <h3 className="text-lg font-semibold text-error mb-4">Danger Zone</h3>

          <div className="space-y-3">
            <div>
              <p className="text-muted text-sm mb-3">
                Once you logout, you'll need to sign in again to access your
                account.
              </p>
              <button
                onClick={handleLogout}
                className="bg-muted text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </div>

            <hr className="border-border my-4" />

            <div>
              <p className="text-error text-sm mb-3 font-medium">
                Delete your account permanently. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="bg-error text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={18} />
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
