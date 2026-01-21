// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/user/login",
  GET_USER: "/user/",

  // Other endpoints can be added here
} as const;
