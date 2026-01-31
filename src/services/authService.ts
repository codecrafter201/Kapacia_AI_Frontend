import axios, { AxiosError } from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/apiConfig";
import type { UserData } from "@/contexts/auth/AuthContext";

interface LoginResponse {
  success: boolean;
  message: string;
  userMessage?: string;
  userData: UserData;
  timestamp: string;
}

interface UserResponse {
  success: boolean;
  message: string;
  userData: UserData;
  timestamp: string;
}

interface BackendErrorResponse {
  error: string;
  code: number;
}

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Backend returns: { success, message, userMessage, userData, timestamp }
    return response.data.userData;
  } catch (error) {
    console.error("Login API error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const errorData = axiosError.response?.data;

      // Try multiple error extraction strategies
      let errorMessage = "Login failed. Please try again.";

      if (errorData) {
        // Strategy 1: Check for error.message (nested error object)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        // Strategy 2: Check for direct message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Strategy 3: Check for userMessage field
        else if (errorData.userMessage) {
          errorMessage = errorData.userMessage;
        }
        // Strategy 4: Check for error string
        else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        }
      }

      throw new Error(errorMessage);
    }

    const message = error instanceof Error ? error.message : "Failed to login";
    throw new Error(message);
  }
};

// Fetch current user
export const fetchCurrentUser = async (token: string): Promise<UserData> => {
  try {
    const response = await axios.get<UserResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.GET_USER}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      }
    );

    // Backend returns: { success, message, userData, timestamp }
    return response.data.userData;
  } catch (error) {
    console.error("Fetch user API error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const errorData = axiosError.response?.data;

      // Try multiple error extraction strategies
      let errorMessage = "Failed to fetch user. Please try again.";

      if (errorData) {
        // Strategy 1: Check for error.message (nested error object)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        // Strategy 2: Check for direct message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Strategy 3: Check for userMessage field
        else if (errorData.userMessage) {
          errorMessage = errorData.userMessage;
        }
        // Strategy 4: Check for error string
        else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        }
      }

      throw new Error(errorMessage);
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch user data";
    throw new Error(message);
  }
};

// Forgot password - request OTP
export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/forget-password`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Forgot password API error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendErrorResponse>;

      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }

      if (axiosError.response) {
        throw new Error(`Request failed: ${axiosError.response.status}`);
      }

      if (axiosError.request) {
        throw new Error(
          "No response from server. Please check your connection."
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to send reset code";
    throw new Error(message);
  }
};

// Verify OTP
export const verifyOtp = async (
  email: string,
  otp: string
): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/verify-otp`,
      { email, otp },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Verify OTP API error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendErrorResponse>;

      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }

      if (axiosError.response) {
        throw new Error(`Verification failed: ${axiosError.response.status}`);
      }

      if (axiosError.request) {
        throw new Error(
          "No response from server. Please check your connection."
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to verify OTP";
    throw new Error(message);
  }
};

// Reset password
export const resetPassword = async (
  email: string,
  password: string
): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/reset-password`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Reset password API error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendErrorResponse>;

      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }

      if (axiosError.response) {
        throw new Error(`Reset failed: ${axiosError.response.status}`);
      }

      if (axiosError.request) {
        throw new Error(
          "No response from server. Please check your connection."
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    throw new Error(message);
  }
};
