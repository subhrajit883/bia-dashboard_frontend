import axios from "axios";
import { authUrl } from "../config/config";

export const TOKEN_KEY = "token";
export const USER_KEY = "user";
export const ROLE_KEY = "role";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const savedUser = localStorage.getItem(USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const getRole = () => localStorage.getItem(ROLE_KEY);

export const saveAuthData = (payload = {}) => {
  const token = payload.token || payload.accessToken || payload.jwt;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (payload.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  if (payload.role) {
    localStorage.setItem(ROLE_KEY, payload.role);
  }

  return token;
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const isAuthenticated = () => Boolean(getToken());

export const loginUser = async ({ email, password, role = "counsellor" }) => {
  const response = await axios.post(
    authUrl.login,
    {
      email: email.trim(),
      password,
      role,
    },
    { withCredentials: true }
  );

  const responseData = response.data;
  const data =
    responseData?.data?.token !== undefined
      ? {
          ...responseData.data,
          success: responseData.success,
          message: responseData.message,
        }
      : responseData?.message?.success !== undefined
        ? responseData.message
        : responseData?.data?.success !== undefined
          ? responseData.data
          : responseData;

  const token = saveAuthData(data);

  if (data?.success && token) {
    return { success: true, data };
  }

  return {
    success: false,
    message: data?.message || "Unable to login.",
  };
};

export const logoutUser = () => {
  clearAuthData();
};
