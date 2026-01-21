import axios from "axios";
import { AuthHeader, setStoredUser } from "./auth.utils";
import { Config } from "../../config";
const baseURL = Config.API_BASE_URL;
console.log(baseURL);

// Helper: handle session-expiry UI + cleanup
async function handleSessionExpiry(rawMessage) {
  try {
    // dynamic import to avoid SSR issues
    const Swal = (await import("sweetalert2")).default;
    const text =
      typeof rawMessage === "string" && rawMessage
        ? rawMessage
        : "You were signed in somewhere else.";
    // show a non-blocking alert for ~3.5s, then continue to logout
    await Swal.fire({
      icon: "warning",
      title: "Session expired",
      text: text,
      timer: 3500,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  } catch (swalErr) {
    // ignore Swal errors
    console.warn("Swal failed", swalErr);
  }

  try {
    setStoredUser(null, { writeCookie: true });
    window.dispatchEvent(new Event("user-updated"));
    if (typeof window !== "undefined") window.location.href = "/login";
  } catch (e) {
    console.warn("Failed to force logout after session expiry:", e);
  }
}

// Centralized API caller with basic session-expiry handling.
export const GetApiData = async (endpoint, method, payload, secured) => {
  let headers = AuthHeader();
  let apiOptions = { url: baseURL + endpoint };
  if (method !== "") apiOptions.method = method;
  if (payload != null) apiOptions.data = payload;
  if (secured !== false) apiOptions.headers = headers;

  try {
    return await axios(apiOptions);
  } catch (err) {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message || err?.response?.data?.error || "";
    if (
      status === 401 &&
      typeof message === "string" &&
      (message.toLowerCase().includes("session expired") ||
        message.toLowerCase().includes("signed-in elsewhere") ||
        message.toLowerCase().includes("signed in elsewhere"))
    ) {
      // show Swal then logout
      await handleSessionExpiry(message);
    }
    throw err;
  }
};

export const GetProgressData = async (endpoint, method, payload, secured) => {
  let headers = AuthHeader();
  let apiOptions = { url: mediaUrl + endpoint };
  if (method !== "") apiOptions.method = method;
  if (payload != null) apiOptions.data = payload;
  if (secured !== false) apiOptions.headers = headers;
  try {
    return await axios(apiOptions);
  } catch (err) {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message || err?.response?.data?.error || "";
    if (
      status === 401 &&
      typeof message === "string" &&
      (message.toLowerCase().includes("session expired") ||
        message.toLowerCase().includes("signed-in elsewhere") ||
        message.toLowerCase().includes("signed in elsewhere"))
    ) {
      await handleSessionExpiry(message);
    }
    throw err;
  }
};

export const PostFormData = async (
  endpoint,
  method,
  payload,
  secured,
  headers,
  responseType
) => {
  let authHeaders = AuthHeader();
  let allHeaders = { ...authHeaders, ...headers };
  let apiOptions = { url: mediaUrl + endpoint };
  if (method !== "") apiOptions.method = method;
  if (payload != null) apiOptions.data = payload;
  if (method !== "") apiOptions.method = method;
  if (responseType !== "") apiOptions.responseType = responseType;
  if (secured !== false) apiOptions.headers = allHeaders;

  try {
    return await axios(apiOptions);
  } catch (err) {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message || err?.response?.data?.error || "";
    if (
      status === 401 &&
      typeof message === "string" &&
      (message.toLowerCase().includes("session expired") ||
        message.toLowerCase().includes("signed-in elsewhere") ||
        message.toLowerCase().includes("signed in elsewhere"))
    ) {
      await handleSessionExpiry(message);
    }
    throw err;
  }
};
