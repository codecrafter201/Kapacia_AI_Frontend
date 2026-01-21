import { apiRequest } from "./api";

export interface WalletSignData {
  message: string;
  signature: string;
  walletAddress: string;
  referralCode?: string; // Optional referral code for new users
}

export interface User {
  _id: string;
  walletAddress: string;
  name?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  nationality?: string;
  role: string;
  isAdmin?: boolean; // Admin flag
  createdAt?: string;
  updatedAt?: string;
  token: string; // Added by backend controller
  referralCode?: string; // User's own referral code
  referralCount?: number; // Number of users referred by this user
  referredBy?: string; // ID of the user who referred this user
  completedTokens?: number; // Number of tokens the user has bought
  purchasedUsd?: number; // Total USD amount spent by the user
  pendingTokens?: number; // Number of tokens pending for the user
  totalTokens?: number; // Total number of tokens the user has
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  source: string;
  publishedAt: string;
}

export interface WalletSignResponse {
  success?: boolean;
  data?: User;
  message?: string;
}

// Wallet authentication service
export const WalletSign = async (
  data: WalletSignData
): Promise<WalletSignResponse> => {
  return await apiRequest("/user/connect", "POST", data, false); // Don't include auth header for initial connection
};

// Get user profile
export const GetUserProfile = async (): Promise<{
  success: boolean;
  data: User;
}> => {
  return await apiRequest("/user/me", "GET", null, true);
};

// Update user profile
export const UpdateUserProfile = async (profileData: {
  name?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  nationality?: string;
}): Promise<{
  success: boolean;
  data: User;
}> => {
  return await apiRequest("/user/update", "PUT", profileData, true);
};

// Get user's referral information
export const GetMyReferral = async (): Promise<{
  success: boolean;
  data: { referralCode: string; referralCount: number };
}> => {
  return await apiRequest("/user/referral", "GET", null, true);
};

// Get list of users referred by current user
export const GetMyReferrals = async (): Promise<{
  success: boolean;
  data: Array<{
    _id: string;
    walletAddress: string;
    name?: string;
    createdAt: string;
  }>;
}> => {
  return await apiRequest("/user/referrals", "GET", null, true);
};

export const GetLatestNews = async (): Promise<{
  success: boolean;
  data: NewsItem[];
}> => {
  return await apiRequest("/news", "GET", null, false);
};

// Admin API - Get all users with pagination and filters
export const GetAllUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isAdmin?: boolean;
  sortBy?: string;
}): Promise<{
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.role) queryParams.append("role", params.role);
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.isAdmin !== undefined)
    queryParams.append("isAdmin", params.isAdmin.toString());

  const endpoint = `/admin/all${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  return await apiRequest(endpoint, "GET", null, true);
};

// Login form service (for traditional email/password if needed)
export const LoginForm = async (data: { email: string; password: string }) => {
  return await apiRequest("/user/login", "POST", data, true);
};

// Signup service
export const UsersCreate = async (data: {
  email: string;
  password: string;
  name?: string;
}) => {
  return await apiRequest("/user/signup", "POST", data, true);
};

// Utility functions for local storage
export const setUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

// Helper function to update user profile data in localStorage
export const updateUserInStorage = (
  profileData: Partial<User>
): User | null => {
  const currentUser = getUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...profileData };
    setUser(updatedUser);
    return updatedUser;
  }
  return null;
};

export const clearUser = () => {
  localStorage.removeItem("user");
};

export const clearAllAuthData = () => {
  // Clear user data
  localStorage.removeItem("user");

  // Clear wallet connection flag
  localStorage.removeItem("walletConnected");

  // Clear any potential token storage
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");

  // Clear session storage as well
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("walletConnected");
};

// Helper function to check and clean invalid auth data
export const validateAndCleanAuthData = (): boolean => {
  const user = getUser();
  if (user && user.token) {
    // If token is temporary or invalid, clean it up
    if (user.token.startsWith("temp_") || user.token.length < 10) {
      console.log(
        "Found invalid token, clearing auth data:",
        user.token.substring(0, 20) + "..."
      );
      clearAllAuthData();
      return false;
    }
    return true;
  }
  return false;
};

export const isAuthenticated = (): boolean => {
  const user = getUser();
  // Ensure we have a valid token that's not a temporary one
  return !!(
    user &&
    user.token &&
    user.token.length > 10 &&
    !user.token.startsWith("temp_")
  );
};
