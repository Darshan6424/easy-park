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
    try {
      const userData = getUser();
      setUserState(userData);
    } catch (err) {
      console.error("Auth init error:", err);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const response = await fetch(
        `${APP_CONFIG.api.baseURL}/api/sign-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || "Login failed" };
      }

      setUser(data.user);
      setUserState(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error" };
    }
  };

  // ✅ REGISTER
  const register = async (userData) => {
    try {
      const response = await fetch(
        `${APP_CONFIG.api.baseURL}/api/sign-up`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || "Register failed" };
      }

      setUser(data.user);
      setUserState(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Network error" };
    }
  };

  // ✅ LOGOUT (only clears frontend unless backend route exists)
  const logout = async () => {
    try {
      await fetch(`${APP_CONFIG.api.baseURL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logoutUtil();
      setUserState(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    setUserState(userData);
  };

  const isAuthenticated = () => isLoggedIn();

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default useAuth;
