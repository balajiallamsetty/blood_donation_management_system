import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "https://blood-donation-management-system-w5tr.onrender.com";

const http = axios.create({
  baseURL,
});

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
