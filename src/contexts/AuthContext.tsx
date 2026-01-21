import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { loginUser, fetchCurrentUser } from "@/services/authService";
import { AuthContext } from "./auth/AuthContext";
import type { UserData, AuthContextType } from "./auth/AuthContext";
import { toast } from "react-toastify";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const getStoredUser = (): UserData | null => {
    if (typeof window === "undefined") return null; // safety for SSR
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  const [user, setUser] = useState<UserData | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Get token from localStorage
  const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };

  // Set token in localStorage
  const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  };

  // Remove token from localStorage
  const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
  };

  // Set user in localStorage
  const setStoredUser = (userData: UserData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // Remove user from localStorage
  const removeStoredUser = () => {
    localStorage.removeItem(USER_KEY);
  };

  // Fetch user data
  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userData = await fetchCurrentUser(token);
      setUser(userData);
      setStoredUser(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      removeToken();
      removeStoredUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string,
  ): Promise<UserData | null> => {
    try {
      setIsLoading(true);
      const userData = await loginUser(email, password);

      // userData now contains the user object with token directly
      setToken(userData.token);
      setUser(userData);
      setStoredUser(userData);
      // toast.success("Login successful!");
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    removeToken();
    removeStoredUser(); // ✅ FIX: Also remove user from localStorage
    setUser(null);
    // toast.info("Logged out successfully");
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setIsLoading(true);
        const userData = await fetchCurrentUser(token);
        setUser(userData);
        setStoredUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        removeToken();
        removeStoredUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
