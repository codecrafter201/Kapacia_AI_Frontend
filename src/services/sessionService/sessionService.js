import { GetApiData } from "../../utils/http-client";

// Create a new session
export const createSession = function (data) {
  return GetApiData(`/session`, "POST", data, true);
};

// Get all sessions for a specific case
export const getSessionsByCase = function (caseId, params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.language) queryParams.append("language", params.language);

  const query = queryParams.toString();
  return GetApiData(
    `/session/case/${caseId}${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Get recent sessions for dashboard
export const getRecentSessions = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit);

  const query = queryParams.toString();
  return GetApiData(
    `/session/recent${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Get all sessions (Admin only)
export const getAllSessions = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.page) queryParams.append("page", params.page);

  const query = queryParams.toString();
  return GetApiData(
    `/session/all/list${query ? `?${query}` : ""}`,
    "GET",
    null,
    true,
  );
};

// Get session by ID
export const getSessionById = function (sessionId) {
  return GetApiData(`/session/${sessionId}`, "GET", null, true);
};

// Get fresh presigned audio URL for a session
export const getSessionAudioUrl = function (sessionId) {
  return GetApiData(`/session/${sessionId}/audio-url`, "GET", null, true);
};

// Update session
export const updateSession = function (sessionId, data) {
  return GetApiData(`/session/${sessionId}`, "PUT", data, true);
};

// Start recording
export const startRecording = function (sessionId) {
  return GetApiData(`/session/${sessionId}/start-recording`, "POST", {}, true);
};

// Stop recording
export const stopRecording = function (sessionId, data) {
  return GetApiData(`/session/${sessionId}/stop-recording`, "POST", data, true);
};

// Upload recording to S3
export const uploadRecording = function (sessionId, formData) {
  return GetApiData(`/session/${sessionId}/upload-recording`, "POST", formData, true);
};

// Delete session
export const deleteSession = function (sessionId) {
  return GetApiData(`/session/${sessionId}`, "DELETE", null, true);
};
