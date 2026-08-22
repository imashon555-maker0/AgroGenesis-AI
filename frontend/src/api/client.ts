import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Could add auth tokens here in the future
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
