// frontend/src/components/layout/header.jsx
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, ScanLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import APP_CONFIG from "../../config/config.js";
import { isLoggedIn, getUser, logout } from "../../utils/auth.js";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

  const mobileMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsMenuOpen(false);
      setShowProfileMenu(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="bg-background border-primary border-b sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-background font-bold text-xl">
                PMI
              </div>
              <span className="text-2xl font-bold text-primary">
                {APP_CONFIG.name.english}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-text hover:text-primary transition-colors"
              >
                Home
              </Link>
              {loggedIn && user?.role !== "OWNER" && (
                <Link
                  to="/my-bookings"
                  className="text-text hover:text-primary transition-colors"
                >
                  My Bookings
                </Link>
              )}
              {user?.role === "OWNER" && (
                <Link
                  to="/owner-dashboard"
                  className="text-text hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/locations"
                className="text-text hover:text-primary transition-colors"
              >
                Locations
              </Link>
              {isOwnerOrAdmin && (
                <Link
                  to="/scan"
                  className="text-text hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ScanLine size={18} />
                  Scan
                </Link>
              )}
              {isOwnerOrAdmin && (
                <Link
                  to="/owner-map"
                  className="text-text hover:text-primary transition-colors"
                >
                  Manage Locations
                </Link>
              )}
              <Link
                to="/about"
                className="text-text hover:text-primary transition-colors"
              >
                About
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              {loggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 text-text hover:text-primary transition-colors"
                  >
                    <User size={20} />
                    <span>{user?.fullName || "Profile"}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-2">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-text hover:bg-background transition-colors flex items-center gap-2"
                      >
                        <User size={16} />
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-error hover:bg-background transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    className="text-text hover:text-primary transition-colors"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </button>
                  <button
                    className="bg-primary text-background px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    onClick={() => navigate("/register")}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-text"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay - Only on mobile */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div
            ref={mobileMenuRef}
            className="fixed top-20 right-4 w-64 bg-surface border border-border rounded-lg shadow-2xl py-4 z-50 md:hidden"
          >
            <div className="flex flex-col gap-2 px-4">
              <Link
                to="/"
                className="text-text hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {loggedIn && user?.role !== "OWNER" && (
                <Link
                  to="/my-bookings"
                  className="text-text hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}
              {user?.role === "OWNER" && (
                <Link
                  to="/owner-dashboard"
                  className="text-text hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/locations"
                className="text-text hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Locations
              </Link>
              {isOwnerOrAdmin && (
                <Link
                  to="/scan"
                  className="text-text hover:text-primary transition-colors py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ScanLine size={18} />
                  Scan Ticket
                </Link>
              )}
              {isOwnerOrAdmin && (
                <Link
                  to="/owner-map"
                  className="text-text hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Manage Locations
                </Link>
              )}
              <Link
                to="/about"
                className="text-text hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              <hr className="border-border my-2" />

              {loggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="text-text hover:text-primary transition-colors text-left flex items-center gap-2 py-2"
                  >
                    <User size={18} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-error hover:opacity-80 transition-opacity text-left flex items-center gap-2 py-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="text-text hover:text-primary transition-colors text-left py-2"
                    onClick={() => {
                      navigate("/login");
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </button>
                  <button
                    className="bg-primary text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity mt-2"
                    onClick={() => {
                      navigate("/register");
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
