import http from "./Http";

// 🩸 Get donor profile
export const getMyProfile = async () => {
  const res = await http.get("/donors/me");
  return res.data;
};

// 🩸 Update donor profile
export const updateMyProfile = async (data) => {
  const res = await http.put("/donors/me", data);
  return res.data;
};

// 🩸 Get donation history
export const getDonationHistory = async () => {
  const res = await http.get("/donations/me/history");
  return res.data;
};

// 🩸 Record donation (creates a pending donation entry)
export const recordDonation = async (data) => {
  const res = await http.post("/donations/record", data);
  return res.data;
};

// 🩸 Verify donation (admin or hospital context)
export const verifyDonation = async (id) => {
  const res = await http.patch(`/donations/${id}/verify`);
  return res.data;
};

// 🩸 Get alerts (read-only for now)
export const getAlerts = async () => {
  const res = await http.get("/alerts");
  return res.data;
};
