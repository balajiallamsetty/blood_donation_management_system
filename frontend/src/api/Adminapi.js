import http from "./Http"; // ✅ Make sure http.js attaches the JWT token automatically

// ====================
// 📊 ADMIN OVERVIEW
// ====================
export const getAudit = async () => {
  const res = await http.get("/admin/audit", {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    params: { _t: Date.now() },
  });
  const data = res.data;
  if (data?.success) return data;
  // Backward-compat: older API returned { donors, hospitals }
  const donorsCount = typeof data?.donors === 'number' ? data.donors : 0;
  const hospitalsCount = typeof data?.hospitals === 'number' ? data.hospitals : 0;
  return {
    success: true,
    users: { total: 0, byRole: { donors: donorsCount, hospitals: hospitalsCount, admins: 0 }, donors: { verified: 0, pending: 0 } },
    hospitals: { total: hospitalsCount, verified: 0 },
    donations: { total: 0, pending: 0, completed: 0 },
    requests: { total: 0, open: 0, fulfilled: 0 },
  };
};

// ====================
// 🩸 DONORS
// ====================
export const getPendingDonors = async () => {
  const res = await http.get("/admin/pending-donors", {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    params: { _t: Date.now() },
  });
  return Array.isArray(res.data?.data) ? res.data.data : res.data;
};

// Approve or reject donor
export const updateDonorStatus = async (userId, approve) => {
  const res = await http.patch(`/admin/donors/${userId}`, { approve });
  return res.data;
};

// ====================
// 🏥 HOSPITALS
// ====================
export const getPendingHospitals = async () => {
  const res = await http.get("/admin/pending-hospitals", {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    params: { _t: Date.now() },
  });
  return Array.isArray(res.data?.data) ? res.data.data : res.data;
};

// Verify or reject hospital
export const updateHospitalStatus = async (id, verify) => {
  const res = await http.patch(`/admin/hospitals/${id}`, { verify });
  return res.data;
};

// Create hospital and generate credentials
export const createHospital = async (hospitalData) => {
  const res = await http.post('/admin/hospitals', hospitalData);
  return res.data;
};

// ====================
// 💉 DONATIONS (Verification)
// ====================
export const getPendingDonations = async () => {
  const res = await http.get("/admin/pending-donations", {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    params: { _t: Date.now() },
  });
  return Array.isArray(res.data?.data) ? res.data.data : res.data;
};

// Verify or reject donation
export const updateDonationStatus = async (donationId, verify) => {
  const res = await http.patch(`/admin/donations/${donationId}`, { verify });
  return res.data;
};

// Combined overview: audit + pending donors + pending donations
export const getOverview = async () => {
  try {
    const res = await http.get('/admin/overview', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      params: { _t: Date.now() },
      validateStatus: () => true,
    });
    if (res.status === 200 && res.data?.success) {
      const data = res.data;
      return {
        audit: data.audit,
        pendingDonors: Array.isArray(data.pendingDonors) ? data.pendingDonors : [],
        pendingDonations: Array.isArray(data.pendingDonations) ? data.pendingDonations : [],
      };
    }
    // Fallback for older server (no /overview yet): fetch individually
    const [audit, donors, donations] = await Promise.all([
      getAudit(),
      getPendingDonors(),
      getPendingDonations(),
    ]);
    return {
      audit: audit?.success ? audit : audit,
      pendingDonors: Array.isArray(donors) ? donors : (Array.isArray(donors?.data) ? donors.data : []),
      pendingDonations: Array.isArray(donations) ? donations : (Array.isArray(donations?.data) ? donations.data : []),
    };
  } catch {
    // Last resort: also try fallback if /overview errors out
    const [audit, donors, donations] = await Promise.all([
      getAudit(),
      getPendingDonors(),
      getPendingDonations(),
    ]);
    return {
      audit: audit?.success ? audit : audit,
      pendingDonors: Array.isArray(donors) ? donors : (Array.isArray(donors?.data) ? donors.data : []),
      pendingDonations: Array.isArray(donations) ? donations : (Array.isArray(donations?.data) ? donations.data : []),
    };
  }
};
