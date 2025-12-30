import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import APP_CONFIG from "../config/config.js";
import { useNavigate } from "react-router-dom";
import { setUser } from "../utils/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      console.log("Sending data:", { email, password });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sign-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
      );

      const result = await response.json();
      console.log("Backend Response:", result);

      if (response.ok) {
        console.log("Login successful:", result);
        setUser(result.user);

        if (result.message) {
          console.log("Success message:", result.message);
        }

        navigate("/");
      } else {
        setErrors({ submit: result.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const newErrors = {};

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    loginUser(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Welcome Back
          </h1>
          <p className="text-muted">Login to {APP_CONFIG.name}</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="space-y-6">
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
                  placeholder="Enter your password"
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

            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {errors.submit && (
              <div className="bg-error bg-opacity-10 border border-error px-4 py-3 rounded-lg text-sm">
                <p className="text-text text-center">{errors.submit}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-muted">
                Don't have an account?
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="w-full border border-primary text-primary py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
