import axios from "axios";

// Normalize the API base so users can set either the full API base
// (including `/api/v1`) or just the backend root URL.
const rawEnvBase = import.meta.env.VITE_API_BASE || "";
const fallback = "http://localhost:5000/api/v1";
let baseURL;
if (!rawEnvBase) {
  baseURL = fallback;
} else {
  const trimmed = rawEnvBase.replace(/\/$/, "");
  // If the provided base already contains /api/v1, use it as-is.
  if (trimmed.endsWith("/api/v1") || trimmed.includes("/api/v1")) {
    baseURL = trimmed;
  } else {
    // Otherwise assume the user provided the backend root and append the API prefix.
    baseURL = `${trimmed}/api/v1`;
  }
}

const http = axios.create({ baseURL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;

// Helpful runtime log (can remove in prod build):
if (import.meta.env.DEV) {
  console.log("API base URL:", baseURL);
}
