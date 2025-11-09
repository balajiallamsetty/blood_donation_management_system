import http from "./Http";

export const signupUser = async (formData) => {
  const response = await http.post(`/auth/signup`, formData);
  return response.data;
};

export const signupAdmin = async (formData) => {
  const response = await http.post(`/auth/signupAdmin`, formData);
  return response.data;
};

export const loginUser = async (formData) => {
  const response = await http.post(`/auth/login`, formData);
  return response.data;
};
