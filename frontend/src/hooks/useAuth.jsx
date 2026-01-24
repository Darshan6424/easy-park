// frontend/src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from "react";
import APP_CONFIG from "../config/config";
import {
  getUser,
  setUser,
  logout as logoutUtil,
  isLoggedIn,
} from "../utils/auth.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = getUser();
        setUserState(userData);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseURL}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }

      if (data.user) {
        setUser(data.user);
        setUserState(data.user);

        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error: "Invalid response from server",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${APP_CONFIG.api.baseURL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logoutUtil();
      setUserState(null);
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseURL}/api/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }

      if (data.user) {
        setUser(data.user);
        setUserState(data.user);

        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error: "Invalid response from server",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    setUserState(userData);
  };

  const isAuthenticated = () => {
    return isLoggedIn();
  };

  const value = {
    user,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default useAuth;
