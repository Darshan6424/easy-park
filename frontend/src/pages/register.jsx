import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, MapPin } from "lucide-react";
import APP_CONFIG from "../config/config.js";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    address: "",
    deviceId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Generate device ID on mount
  useEffect(() => {
    const generateDeviceId = () => {
      return `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    };

    setFormData((prev) => ({
      ...prev,
      deviceId: generateDeviceId(),
    }));
  }, []);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const registerUser = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sign-up`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();

      console.log("Backend Response:", result);

      if (response.ok) {
        console.log("Registration successful:", result);
        navigate("/login");
      } else {
        setErrors({ submit: result.message || "Registration failed" });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerUser(formData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Create Account
          </h1>
          <p className="text-muted">Sign up for {APP_CONFIG.name.english}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-text mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={20}
                />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 bg-background border ${
                    errors.fullName ? "border-error" : "border-border"
                  } rounded-lg focus: outline-none focus:ring-2 focus:ring-primary text-text`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && (
                <p className="text-error text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={20}
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 bg-background border ${
                    errors.email ? "border-error" : "border-border"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-error text-sm mt-1">{errors.email}</p>
              )}
            </div>
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3 bg-background border ${
                    errors.password ? "border-error" : "border-border"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password}</p>
              )}
            </div>
            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-text mb-2"
              >
                Address
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={20}
                />
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 bg-background border ${
                    errors.address ? "border-error" : "border-border"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text`}
                  placeholder="123 Main St"
                />
              </div>
              {errors.address && (
                <p className="text-error text-sm mt-1">{errors.address}</p>
              )}
            </div>
            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-error bg-opacity-10 border border-error px-4 py-3 rounded-lg text-sm flex justify-center">
                <p className="text-text">{errors.submit}</p>
              </div>
            )}
            {/* Submit Button */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-muted">
                Already have an account?
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full border border-primary text-primary py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
