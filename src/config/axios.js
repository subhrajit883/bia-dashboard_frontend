import axios from "axios";
import { getToken, clearAdminAuthData, clearCounsellorAuthData } from "../utils/auth";
import { BASE_URL } from "./config";

let isRedirecting = false;

/**
 * Handle 401 Unauthorized errors across all API requests.
 * Redirects:
 * - Admin -> /admin/login
 * - Counsellor -> /counsellor/login
 */
export const handle401Error = (error, roleHint = null) => {
  const status = error?.response?.status ?? error?.status;
  if (status !== 401) {
    return;
  }

  // Never redirect on auth endpoints (e.g. invalid credentials on login, register, reset password)
  const reqUrl = error?.config?.url || "";
  const isAuthEndpoint =
    reqUrl.includes("/auth/login") ||
    reqUrl.includes("/auth/register") ||
    reqUrl.includes("/auth/forgot-password") ||
    reqUrl.includes("/auth/reset-password");

  if (isAuthEndpoint) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname;

  // If user is already on either login page, don't trigger redirects
  if (currentPath === "/admin/login" || currentPath === "/counsellor/login") {
    return;
  }

  // Determine whether it's Admin or Counsellor
  let isAdmin = false;

  if (roleHint === "admin") {
    isAdmin = true;
  } else if (roleHint === "counsellor") {
    isAdmin = false;
  } else if (currentPath.startsWith("/admin")) {
    isAdmin = true;
  } else if (currentPath.startsWith("/counsellor")) {
    isAdmin = false;
  } else {
    const adminToken = localStorage.getItem("adminToken");
    const counsellorToken = localStorage.getItem("token");

    const authHeader =
      error?.config?.headers?.Authorization ||
      error?.config?.headers?.authorization ||
      (typeof error?.config?.headers?.get === "function"
        ? error.config.headers.get("Authorization")
        : "");

    if (authHeader && adminToken && authHeader.includes(adminToken)) {
      isAdmin = true;
    } else if (authHeader && counsellorToken && authHeader.includes(counsellorToken)) {
      isAdmin = false;
    } else if (adminToken && !counsellorToken) {
      isAdmin = true;
    } else if (counsellorToken && !adminToken) {
      isAdmin = false;
    } else if (localStorage.getItem("adminRole") === "admin") {
      isAdmin = true;
    }
  }

  const targetPath = isAdmin ? "/admin/login" : "/counsellor/login";

  if (currentPath === targetPath) {
    return;
  }

  if (isRedirecting) {
    return;
  }

  isRedirecting = true;
  setTimeout(() => {
    isRedirecting = false;
  }, 3000);

  // Clear respective auth credentials
  if (isAdmin) {
    clearAdminAuthData();
  } else {
    clearCounsellorAuthData();
  }

  try {
    sessionStorage.setItem(
      "auth_session_expired",
      "Session expired. Please log in again."
    );
  } catch (e) {
    console.error("Failed to set session storage:", e);
  }

  window.location.replace(targetPath);
};

// 1. Interceptors for default axios instance (used by majority of pages)
axios.interceptors.request.use(
  (config) => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const hasAuth =
      config.headers?.Authorization ||
      config.headers?.authorization ||
      (typeof config.headers?.get === "function" && config.headers.get("Authorization"));

    if (!hasAuth) {
      if (pathname.startsWith("/admin")) {
        const token = localStorage.getItem("adminToken");
        if (token) {
          if (config.headers && typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${token}`);
          } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } else if (pathname.startsWith("/counsellor")) {
        const token = localStorage.getItem("token");
        if (token) {
          if (config.headers && typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${token}`);
          } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    handle401Error(error);
    return Promise.reject(error);
  }
);

// 2. Interceptors for api instance
const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handle401Error(error, "counsellor");
    return Promise.reject(error);
  }
);

export default api;

// 3. Interceptors for adminApi instance
export const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    if (token) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    handle401Error(error, "admin");
    return Promise.reject(error);
  }
);
