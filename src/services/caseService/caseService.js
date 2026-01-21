import { GetApiData } from "../../utils/http-client";

// Create a new case (Admin only)
export const createCase = function (data) {
  return GetApiData(`/case`, "POST", data, true);
};

// Get all cases (Admin only)
export const getAllCases = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.assignedTo) queryParams.append("assignedTo", params.assignedTo);

  const query = queryParams.toString();
  return GetApiData(`/case${query ? `?${query}` : ""}`, "GET", null, true);
};

// Get my cases (Practitioner)
export const getMyCases = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);

  const query = queryParams.toString();
  return GetApiData(
    `/case/my-cases${query ? `?${query}` : ""}`,
    "GET",
    null,
    true
  );
};

// Get case by ID
export const getCaseById = function (caseId) {
  return GetApiData(`/case/${caseId}`, "GET", null, true);
};

// Update case (Admin only)
export const updateCase = function (caseId, data) {
  return GetApiData(`/case/${caseId}`, "PUT", data, true);
};

// Delete case (Admin only)
export const deleteCase = function (caseId) {
  return GetApiData(`/case/${caseId}`, "DELETE", null, true);
};

// Get case timeline
export const getCaseTimeline = function (caseId, params = {}) {
  const queryParams = new URLSearchParams();
  if (params.eventType) queryParams.append("eventType", params.eventType);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const query = queryParams.toString();
  return GetApiData(
    `/case/${caseId}/timeline${query ? `?${query}` : ""}`,
    "GET",
    null,
    true
  );
};
