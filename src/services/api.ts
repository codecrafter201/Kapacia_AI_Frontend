import axios, { AxiosError } from "axios";

// Base API configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";

interface BackendErrorResponse {
  error: string;
  code: number;
  message?: string;
}

export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown,
  includeAuth?: boolean
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth header if needed
  if (includeAuth) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("API Request - User from localStorage:", user);
    if (
      user.token &&
      user.token.length > 10 &&
      !user.token.startsWith("temp_")
    ) {
      // Backend expects 'x-access-token' header, not Authorization Bearer
      headers["x-access-token"] = user.token;
      console.log(
        "API Request - Added x-access-token header:",
        user.token.substring(0, 20) + "..."
      );
    } else {
      console.log("API Request - Invalid or missing token:", {
        hasToken: !!user.token,
        tokenLength: user.token?.length,
        isTemp: user.token?.startsWith("temp_"),
        tokenPreview: user.token?.substring(0, 20),
      });
      throw new Error(
        "Authentication required: Please reconnect your wallet to get a valid token"
      );
    }
  }

  try {
    console.log(`API Request: ${method} ${url}`, data); // Debug log

    const response = await axios({
      url,
      method,
      headers,
      data: method !== "GET" ? data : undefined,
    });

    console.log(`API Response:`, response.status, response.data); // Debug log

    return response.data;
  } catch (error) {
    console.error("API Request Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendErrorResponse>;

      // Check if backend returned error in the expected format {error: "...", code: ...}
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }

      // Check for message field as fallback
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      }

      // Fallback for other axios errors
      if (axiosError.response) {
        throw new Error(
          `Request failed with status ${axiosError.response.status}`
        );
      }

      if (axiosError.request) {
        throw new Error(
          "No response from server. Please check your connection."
        );
      }
    }

    throw error;
  }
};
