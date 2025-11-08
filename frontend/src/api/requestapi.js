import http from "./Http";

// ✅ Create new blood request
export const createBloodRequest = async (data) => {
  const res = await http.post("/requests", data);
  return res.data;
};

// ✅ Get all requests
export const getAllRequests = async () => {
  const res = await http.get("/requests");
  return res.data;
};

// ✅ Get request by ID
export const getRequestById = async (id) => {
  const res = await http.get(`/requests/${id}`);
  return res.data;
};

// ✅ Update status
export const updateRequestStatus = async (id, status) => {
  const res = await http.patch(`/requests/${id}/status`, { status });
  return res.data;
};

// ✅ Fulfill request
export const fulfillRequest = async (id, data) => {
  const res = await http.post(`/requests/${id}/fulfill`, data);
  return res.data;
};
