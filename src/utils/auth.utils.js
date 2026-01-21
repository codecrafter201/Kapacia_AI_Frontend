// utils/auth.utils.js
import Cookies from "js-cookie";

// ---- Token management (matching AuthContext.tsx) ----
const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

// Get token from localStorage
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in localStorage
export const setToken = (token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove token from localStorage
export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

// ---- Safe localStorage helpers ----
export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user, { writeCookie = false } = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    const userString = JSON.stringify(user);
    localStorage.setItem(USER_KEY, userString);

    // Also store token if it exists in user object
    if (user.token) {
      setToken(user.token);
    }
  } else {
    localStorage.removeItem(USER_KEY);
    removeToken();
  }

  if (writeCookie) {
    try {
      const cookieOptions = {
        expires: 7,
        path: "/",
        sameSite: "lax",
      };

      // Only set secure in production (HTTPS)
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:"
      ) {
        cookieOptions.secure = true;
      }

      if (user) {
        const essentialUserData = {
          id: user.id || user._id,
          role: user.role,
          email: user.email,
          name: user.name,
          token: user.token,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        const cookieData = JSON.stringify(essentialUserData);

        Cookies.set("user", cookieData, cookieOptions);
      } else {
        Cookies.remove("user");
        console.log("[auth.utils] setStoredUser: Cookie removed");
      }
    } catch (err) {
      console.error("[auth.utils] setStoredUser: Failed to set cookie:", err);
    }
  }

  // tell app to re-read user immediately (same-tab updates)
  window.dispatchEvent(new Event("user-updated"));
};

// ---- Auth Header - FIXED to use TOKEN_KEY ----
export function AuthHeader() {
  // Get token from localStorage directly (not from user object)
  const token = getToken();
  return token ? { "x-access-token": token } : {};
}

export const hasPaidAccess = () => {
  const user = getStoredUser();
  return !!(user && user.isPayment === true);
};

export const GetUserRoles = () => {
  const u = getStoredUser();
  return u?.roles || [];
};

export const AuthName = () => {
  const u = getStoredUser();
  return u?.name || "User";
};

export const GetAuthID = () => {
  const u = getStoredUser();
  return u?.id || u?._id || null;
};

export const GetStudentId = () => {
  const u = getStoredUser();
  return Number(u?.studentCardId) || null;
};

export const isStudent = () => {
  const user = getStoredUser();
  return !!(user && user.role === "STUDENT");
};

export const isTeacher = () => {
  const user = getStoredUser();
  return !!(user && user.role === "TEACHER");
};

const getInitials = (firstName, lastName) => {
  if (!firstName) return "";
  if (!lastName) return firstName.substring(0, 2).toUpperCase();
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const GetUserName = () => {
  const u = getStoredUser();
  if (u?.firstname) {
    const initials = getInitials(u.firstname, u.lastname);
    return initials;
  }
  return null;
};

export const AuthVerify = () => {
  // Verify both token and user exist
  const token = getToken();
  const user = getStoredUser();
  return !!(token && user);
};
