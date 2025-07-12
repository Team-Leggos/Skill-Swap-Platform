import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: jwtToken } = response.data;

      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      await fetchUser(); // Fetch user data after setting the token

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || "Login failed",
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: jwtToken } = response.data;

      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      await fetchUser(); // Fetch user data after setting the token

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || "Signup failed",
      };
    }
  };

  const logout = async () => {
    try {
      // For JWT, logout is primarily client-side token removal.
      // If your server has a /logout endpoint for token blacklisting, call it here.
      // await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Remove if you were storing user data separately
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
    }));
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
