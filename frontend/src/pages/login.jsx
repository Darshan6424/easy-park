// frontend/src/pages/login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import APP_CONFIG from "../config/config";
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (errors.form) {
      setErrors({ ...errors, form: "" });
    }

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setTouched({ email: true, password: true });

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success("Login successful!");
        setTimeout(() => navigate("/home"), 500);
      } else {
        toast.error(result.error || "Login failed");
        setErrors({ form: result.error });
      }
    } catch (error) {
      console.error("Login exception:", error);
      toast.error("Something went wrong. Please try again.");
      setErrors({ form: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <style>{`
        .input-focus {
          transition: all 0.3s ease;
        }
        .input-focus:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
        }
      `}</style>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="w-16 h-16 mx-auto bg-primary rounded-lg flex items-center justify-center text-background font-bold text-2xl mb-4">
              EP
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-primary">
            {APP_CONFIG.name.nepali}
          </h1>
          <h2 className="text-2xl font-semibold text-text mb-2">
            Welcome Back
          </h2>
          <p className="text-text opacity-70">
            Sign in to continue to {APP_CONFIG.name.english}
          </p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl p-8 border border-border">
          {errors.form && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-start">
              <AlertCircle
                size={20}
                className="text-error mr-3 flex-shrink-0 mt-0.5"
              />
              <p className="text-error text-sm">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text opacity-50"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full pl-12 pr-4 py-3 bg-background border rounded-lg focus:outline-none input-focus disabled:opacity-50 disabled:cursor-not-allowed text-text ${
                    errors.email && touched.email
                      ? "border-error"
                      : "border-border"
                  }`}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-2 text-sm text-error flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text opacity-50"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full pl-12 pr-12 py-3 bg-background border rounded-lg focus:outline-none input-focus disabled:opacity-50 disabled:cursor-not-allowed text-text ${
                    errors.password && touched.password
                      ? "border-error"
                      : "border-border"
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text opacity-50 hover:opacity-100"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-2 text-sm text-error flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-background font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-text opacity-70">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-text opacity-70 hover:opacity-100 text-sm transition-opacity"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
