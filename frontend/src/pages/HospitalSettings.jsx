import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Alert from "../components/Alert";
import { Card, CardHeader, CardContent, CardTitle } from "../components/Card";
import useAuthStore from "../store/useAuthStore";
import { getMyHospital, updateHospitalPassword } from "../api/HospitalApi";

const HospitalSettings = () => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState({ visible: false, type: "", message: "" });
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await getMyHospital();
        setHospital(h);
      } catch (e) {
        console.error(e);
        setAlertData({ visible: true, type: "error", message: "Failed to load hospital info" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!alertData.visible) return;
    const t = setTimeout(() => setAlertData({ visible: false, type: "", message: "" }), 3000);
    return () => clearTimeout(t);
  }, [alertData.visible]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setAlertData({ visible: true, type: "error", message: "New password must be at least 8 characters" });
      return;
    }
    if (form.newPassword !== form.confirm) {
      setAlertData({ visible: true, type: "error", message: "Passwords do not match" });
      return;
    }
    if (!hospital?._id) {
      setAlertData({ visible: true, type: "error", message: "Hospital not found" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { newPassword: form.newPassword };
      // Require currentPassword for hospital owners
      const role = (user?.role || localStorage.getItem("role"));
      if (role === "hospital") {
        payload.currentPassword = form.currentPassword;
      }
      // For hospital role, force /me/password to avoid mismatched ids
      const targetId = role === "hospital" ? null : (hospital?._id || null);
      await updateHospitalPassword(targetId, payload);
      setAlertData({ visible: true, type: "success", message: "Password updated successfully" });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to update password";
      setAlertData({ visible: true, type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hospital-dashboard">
      <nav className="subnavbar">
        <div className="container subnavbar-container">
          <div className="subnavbar-left">
            <img src="/favicon.png" alt="Logo" className="logo" />
            <h2 className="subnavbar-title">Settings</h2>
          </div>
          <ul className="subnav-links">
            <li className="subnav-link"><Link to="/hospital">Dashboard</Link></li>
            <li className="subnav-link"><Link to="/hospital/inventory">Inventory</Link></li>
            <li className="subnav-link active">Settings</li>
          </ul>
        </div>
      </nav>

      <div className="dashboard-content container">
        <div className="dashboard-header">
          <h1>Hospital Settings</h1>
          <p className="subtitle">Update your account password</p>
        </div>
        {alertData.visible && <Alert type={alertData.type} message={alertData.message} />}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Card className="card">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="form">
                <div className="form-group">
                  <label>Current Password</label>
                  <Input
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Current password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <Input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <Input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="Retype new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HospitalSettings;
