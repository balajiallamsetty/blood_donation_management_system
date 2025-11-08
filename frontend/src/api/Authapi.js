import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/v1/auth"; // ⚙️ Update for production

// 🩸 Donor Signup
export const signupUser = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/signup`, formData);
  return response.data;
};

// 🧠 Admin Signup (requires secret key)
export const signupAdmin = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/signupAdmin`, formData);
  return response.data;
};

// 🔐 Login (works for both donor & admin)
export const loginUser = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/login`, formData);
  return response.data;
};
