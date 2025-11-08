import http from './Http';

// Fetch hospital by ID
export const getHospital = async (hospitalId) => {
  const { data } = await http.get(`/hospitals/${hospitalId}`);
  return data;
};

export const getMyHospital = async () => {
  const { data } = await http.get('/hospitals/me');
  return data;
};

// Get inventory for hospital
export const getHospitalInventory = async (hospitalId) => {
  const { data } = await http.get(`/inventory/${hospitalId}`);
  return data; // returns array
};

// Replace inventory wholesale
export const replaceInventory = async (hospitalId, items) => {
  const { data } = await http.put(`/inventory/${hospitalId}`, items);
  return data;
};

// Patch single inventory item deltaUnits (+/-)
export const patchInventoryItem = async (hospitalId, { bloodGroup, rh, deltaUnits }) => {
  const { data } = await http.patch(`/inventory/${hospitalId}/item`, { bloodGroup, rh, deltaUnits });
  return data;
};

// Inventory logs and expiry
export const getInventoryLogs = async (hospitalId, limit = 50) => {
  const { data } = await http.get(`/inventory/${hospitalId}/logs`, { params: { limit } });
  return data;
};

export const getInventoryExpiry = async (hospitalId) => {
  const { data } = await http.get(`/inventory/${hospitalId}/expiry`);
  return data;
};

// Requests
export const listRequests = async () => {
  const { data } = await http.get('/requests');
  return data;
};

export const updateRequestStatus = async (id, status) => {
  const { data } = await http.patch(`/requests/${id}/status`, { status });
  return data;
};

export const fulfillRequest = async (id, hospitalId, units) => {
  const { data } = await http.post(`/requests/${id}/fulfill`, { hospitalId, units });
  return data;
};

// Hospital owner password change
export const updateHospitalPassword = async (hospitalId, payload) => {
  // payload: { currentPassword?, newPassword }
  if (hospitalId) {
    const { data } = await http.patch(`/hospitals/${hospitalId}/password`, payload);
    return data;
  }
  const { data } = await http.patch(`/hospitals/me/password`, payload);
  return data;
};
