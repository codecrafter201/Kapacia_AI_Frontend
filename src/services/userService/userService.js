import { GetApiData } from "../../utils/http-client";

// Get all users (Admin only)
export const getAllUsers = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.active !== undefined) queryParams.append("active", params.active);
  if (params.role) queryParams.append("role", params.role);

  const query = queryParams.toString();
  return GetApiData(
    `/user/all-users${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Get all practitioners (Admin only)
export const getPractitioners = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.active !== undefined) queryParams.append("active", params.active);

  const query = queryParams.toString();
  return GetApiData(
    `/user/practitioners${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Create user by admin
export const createUserByAdmin = function (data) {
  return GetApiData("/user/create-user", "POST", data, true);
};

// Update user credentials by admin
export const updateUserCredentials = function (userId, data) {
  return GetApiData(`/user/${userId}/update-credentials`, "PUT", data, true);
};

// Toggle user status (enable/disable)
export const toggleUserStatus = function (userId, data) {
  return GetApiData(`/user/${userId}/toggle-status`, "PUT", data, true);
};

// Update user profile (name)
export const updateProfile = function (data) {
  return GetApiData("/user/profile", "PUT", data, true);
};

// Update user password
export const updatePassword = function (data) {
  return GetApiData("/user/password", "PUT", data, true);
};
