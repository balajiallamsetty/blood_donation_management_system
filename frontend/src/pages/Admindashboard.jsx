import React, { useEffect, useState, useRef } from "react";
import { FaUsers, FaHospital, FaCheckCircle, FaTimesCircle, FaTint } from "react-icons/fa";
import Button from "../components/Button";
import Alert from "../components/Alert";
import AlertDialog from "../components/Alertdialog";
import { Card, CardHeader, CardContent, CardTitle } from "../components/Card";
import {
  updateDonorStatus,
  createHospital,
  updateDonationStatus,
  getOverview,
} from "../api/Adminapi";
import "../styles/Admindashboard.css";

const AdminDashboard = () => {
  // State now matches enriched audit structure returned by backend
  const defaultAudit = {
    users: { total: 0, byRole: { donors: 0, hospitals: 0, admins: 0 }, donors: { verified: 0, pending: 0 } },
    hospitals: { total: 0, verified: 0 },
    donations: { total: 0, pending: 0, completed: 0 },
    requests: { total: 0, open: 0, fulfilled: 0 },
  };
  const [audit, setAudit] = useState(defaultAudit);
  const [pendingDonors, setPendingDonors] = useState([]);
  const [hospitalForm, setHospitalForm] = useState({ name: "", email: "", address: "", location: "" });
  const [hospitalCredentials, setHospitalCredentials] = useState(null);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alertData, setAlertData] = useState({ visible: false, type: "", message: "" });
  const [dialogData, setDialogData] = useState({
    open: false,
    type: "",
    targetId: null,
    action: null,
  });

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return; // Guard against React 18/19 StrictMode double invoke
    loadedRef.current = true;
    const load = async () => {
      try {
        const overview = await getOverview();
        if (overview?.audit) setAudit(overview.audit);
        if (overview?.pendingDonors) setPendingDonors(overview.pendingDonors);
        if (overview?.pendingDonations) setPendingDonations(overview.pendingDonations);
      } catch (err) {
        console.error(err);
        setAlertData({ visible: true, type: 'error', message: 'Failed to load admin overview.' });
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!alertData.visible) return;
    const timer = setTimeout(() => setAlertData((prev) => ({ ...prev, visible: false })), 4000);
    return () => clearTimeout(timer);
  }, [alertData.visible]);

  const confirmAction = (type, id, action) => {
    setDialogData({ open: true, type, targetId: id, action });
  };

  const handleConfirm = async () => {
    const { type, targetId, action } = dialogData;
    setDialogData((prev) => ({ ...prev, open: false }));
    setLoading(true);

    try {
      if (type === "donor") {
        await updateDonorStatus(targetId, action === "approve");
        setPendingDonors((prev) => prev.filter((d) => d._id !== targetId));
      } else if (type === "donation") {
        await updateDonationStatus(targetId, action === "verify");
        setPendingDonations((prev) => prev.filter((d) => d._id !== targetId));
      }

      setAlertData({
        visible: true,
        type: "success",
        message:
          type === "donor"
            ? action === "approve"
              ? "Donor approved successfully ✅"
              : "Donor rejected ❌"
            : type === "hospital"
            ? action === "verify"
              ? "Hospital verified ✅"
              : "Hospital rejected ❌"
            : action === "verify"
            ? "Donation verified ✅"
            : "Donation rejected ❌",
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        visible: true,
        type: "error",
        message: "Action failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get donation display info
  const getDonationDisplay = (donation) => {
    const donor = donation.donor?.name || "Unknown Donor";
    const hospital = donation.hospitalName || donation.hospital?.name || "Manual Entry";
    const units = donation.units || "?";
    const location = donation.location || "No location";
    return { donor, hospital, units, location };
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p className="subtitle">Approve donors, verify hospitals, and verify donation records.</p>

      {alertData.visible && <Alert type={alertData.type} message={alertData.message} />}

      <div className="stats-grid">
        <Card>
          <CardContent>
            <div className="stats-box">
              <div>
                <p className="stat-label">Total Donor Accounts</p>
                <p className="stat-value">{audit.users?.byRole?.donors ?? 0}</p>
                <p className="stat-sub">Verified: {audit.users?.donors?.verified ?? 0} | Pending: {audit.users?.donors?.pending ?? 0}</p>
              </div>
              <FaUsers className="stat-icon" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="stats-box">
              <div>
                <p className="stat-label">Hospitals</p>
                <p className="stat-value">{audit.hospitals?.total ?? 0}</p>
                <p className="stat-sub">Verified: {audit.hospitals?.verified ?? 0}</p>
              </div>
              <FaHospital className="stat-icon" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="stats-box">
              <div>
                <p className="stat-label">Donations</p>
                <p className="stat-value">{audit.donations?.total ?? 0}</p>
                <p className="stat-sub">Pending: {audit.donations?.pending ?? 0} | Completed: {audit.donations?.completed ?? 0}</p>
              </div>
              <FaTint className="stat-icon" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="stats-box">
              <div>
                <p className="stat-label">Requests</p>
                <p className="stat-value">{audit.requests?.total ?? 0}</p>
                <p className="stat-sub">Open: {audit.requests?.open ?? 0} | Fulfilled: {audit.requests?.fulfilled ?? 0}</p>
              </div>
              <FaTint className="stat-icon" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lists-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              <FaUsers className="icon" /> Pending Donors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDonors.length === 0 ? (
              <p>No pending donor approvals 🎉</p>
            ) : (
              pendingDonors.map((d) => (
                <div key={d._id} className="list-item">
                  <div>
                    <h4>{d.name || "Unknown Donor"}</h4>
                    <p>{d.email || "No email provided"}</p>
                  </div>
                  <div className="actions">
                    <Button
                      size="sm"
                      onClick={() => confirmAction("donor", d._id, "approve")}
                      disabled={loading}
                    >
                      <FaCheckCircle /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => confirmAction("donor", d._id, "reject")}
                      disabled={loading}
                    >
                      <FaTimesCircle /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <FaHospital className="icon" /> Add Hospital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="hospital-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setHospitalCredentials(null);
                  try {
                    const payload = { ...hospitalForm };
                    if (typeof payload.location === "string" && payload.location.trim()) {
                      // Accept "lat,lng" string
                      const [lat, lng] = payload.location.split(",").map(Number);
                      payload.location = { lat, lng };
                    }
                    const result = await createHospital(payload);
                    setHospitalCredentials(result.credentials);
                    setAlertData({ visible: true, type: "success", message: "Hospital created! Credentials generated below." });
                    setHospitalForm({ name: "", email: "", address: "", location: "" });
                  } catch (err) {
                    setAlertData({ visible: true, type: "error", message: err.response?.data?.message || "Failed to create hospital." });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div>
                  <label>Hospital Name</label>
                  <input
                    className="hospital-input"
                    type="text"
                    required
                    value={hospitalForm.name}
                    onChange={e => setHospitalForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    className="hospital-input"
                    type="email"
                    required
                    value={hospitalForm.email}
                    onChange={e => setHospitalForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Hospital admin email"
                  />
                </div>
                <div>
                  <label>Address</label>
                  <input
                    className="hospital-input"
                    type="text"
                    value={hospitalForm.address}
                    onChange={e => setHospitalForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Hospital address"
                  />
                </div>
                <div>
                  <label>Location (lat,lng)</label>
                  <input
                    className="hospital-input"
                    type="text"
                    value={hospitalForm.location}
                    onChange={e => setHospitalForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. 12.9716,77.5946"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Add Hospital & Generate Credentials"}
                </Button>
              </form>
              {hospitalCredentials && (
                <div style={{ marginTop: "18px", background: "#f8f8f8", padding: "12px", borderRadius: "8px" }}>
                  <strong>Login Credentials:</strong>
                  <div>Email: <code>{hospitalCredentials.email}</code></div>
                  <div>Password: <code>{hospitalCredentials.password}</code></div>
                  <div style={{ fontSize: "0.95em", color: "#e63946" }}>Share these with the hospital admin securely.</div>
                </div>
              )}
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <FaTint className="icon" /> Donation Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDonations.length === 0 ? (
              <p>No pending donation verifications 🎉</p>
            ) : (
              pendingDonations.map((d) => {
                const { donor, hospital, units, location } = getDonationDisplay(d);
                return (
                  <div key={d._id} className="list-item">
                    <div>
                      <h4>{donor}</h4>
                      <p>
                        <strong>Hospital:</strong> {hospital}
                      </p>
                      <p>
                        <strong>Units:</strong> {units} | <strong>Location:</strong> {location}
                      </p>
                    </div>
                    <div className="actions">
                      <Button
                        size="sm"
                        onClick={() => confirmAction("donation", d._id, "verify")}
                        disabled={loading}
                      >
                        <FaCheckCircle /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmAction("donation", d._id, "reject")}
                        disabled={loading}
                      >
                        <FaTimesCircle /> Reject
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={dialogData.open}
        onClose={() => setDialogData((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        title="Confirm Action"
        description={`Are you sure you want to ${dialogData.action} this ${dialogData.type}?`}
        confirmText="Yes, proceed"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminDashboard;
