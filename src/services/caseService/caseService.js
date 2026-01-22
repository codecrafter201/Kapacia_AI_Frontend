import axios from "axios";
import { GetApiData } from "../../utils/http-client";
import { AuthHeader } from "../../utils/auth.utils";
import { Config } from "../../../config";

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
  // Pagination / preview controls
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.page) queryParams.append("page", params.page);

  const query = queryParams.toString();
  return GetApiData(
    `/case/my-cases${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
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
  if (params.allEntries) queryParams.append("allEntries", "true");

  const query = queryParams.toString();
  return GetApiData(
    `/case/${caseId}/timeline${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Export case data with filters; returns axios response with blob
export const exportCaseData = async function (caseId, params = {}) {
  const queryParams = new URLSearchParams();
  if (params.exportType) queryParams.append("exportType", params.exportType);
  if (params.exportFormat) queryParams.append("format", params.exportFormat);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.sessionIds && params.sessionIds.length) {
    queryParams.append("sessionIds", params.sessionIds.join(","));
  }
  if (params.contentToInclude && params.contentToInclude.length) {
    queryParams.append("contentToInclude", params.contentToInclude.join(","));
  }
  if (params.privacyOptions && params.privacyOptions.length) {
    queryParams.append("privacyOptions", params.privacyOptions.join(","));
  }

  const query = queryParams.toString();
  const url = `${Config.API_BASE_URL}/case/${caseId}/export${query ? `?${query}` : ""}`;
  const headers = AuthHeader();

  return axios.get(url, { headers, responseType: "blob" });
};
