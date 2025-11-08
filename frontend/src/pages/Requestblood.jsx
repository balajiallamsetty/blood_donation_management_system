import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTint, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import LocationAutocomplete from "../components/LocationAutocomplete.jsx";
import Button from "../components/Button";
import Input from "../components/Input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../components/Card";
import Alert from "../components/Alert";
import AlertDialog from "../components/Alertdialog";
import { createBloodRequest } from "../api/requestapi";
import "../styles/Requestblood.css";

const RequestBlood = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: "",
    bloodType: "",
    unitsNeeded: "",
    urgency: "",
    hospital: "",
    contact: "",
  notes: "",
  location: null,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: "", message: "" });
  const [confirmOpen, setConfirmOpen] = useState(false); // ✅ added for dialog

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAlert({ visible: false, type: "", message: "" });

    const payload = {
      bloodGroup: formData.bloodType,
      rh: formData.bloodType.endsWith("+") ? "+" : "-",
      unitsNeeded: Number(formData.unitsNeeded),
      urgency: formData.urgency || "normal",
      location: formData.location && formData.location.lat != null && formData.location.lng != null
        ? { lat: formData.location.lat, lng: formData.location.lng }
        : { lat: 0, lng: 0 }, // fallback to satisfy backend validation
      hospitalId: null,
      hospitalName: formData.hospital || undefined,
      contact: formData.contact || undefined,
      patientName: formData.patientName || undefined,
      notes: formData.notes || undefined,
    };

    try {
      const created = await createBloodRequest(payload);
      setAlert({
        visible: true,
        type: "success",
        message: "✅ Blood request submitted successfully!",
      });
      setFormData({
        patientName: "",
        bloodType: "",
        unitsNeeded: "",
        urgency: "",
        hospital: "",
        contact: "",
        notes: "",
        location: null,
      });
      // Navigate to requests list and highlight the new card
      if (created?._id) {
        try {
          sessionStorage.setItem("newRequestId", created._id);
        } catch (_e) {
          // ignore storage errors
          void _e;
        }
      }
      navigate("/requests");
    } catch (err) {
      setAlert({
        visible: true,
        type: "error",
        message:
          err.response?.data?.message || "❌ Failed to submit blood request.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert({ visible: false, type: "", message: "" }), 3000);
    }
  };

  const availableInventory = [
    { bloodType: "A+", units: 45, location: "City Hospital" },
    { bloodType: "O+", units: 52, location: "General Medical" },
    { bloodType: "B+", units: 38, location: "Downtown Clinic" },
  ];

  return (
    <div className="request-page">
      <div className="container">
        <div className="header">
          <h1>Request Blood</h1>
          <p>Submit an emergency blood request to our network</p>
        </div>

        {/* ✅ Alert Section */}
        {alert.visible && (
          <div className="alert-box">
            <Alert
              type={alert.type === "success" ? "default" : "destructive"}
              title={alert.type === "success" ? "Success" : "Error"}
              description={alert.message}
            />
          </div>
        )}

        <div className="grid-two">
          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Request Form</CardTitle>
              <CardDescription>Fill in the details below</CardDescription>
            </CardHeader>

            <CardContent>
              <form className="form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patient Name</label>
                    <Input
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Type Required</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select type</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                        (type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Units Required</label>
                    <Input
                      name="unitsNeeded"
                      type="number"
                      min="1"
                      placeholder="Number of units"
                      value={formData.unitsNeeded}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Urgency Level</label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select urgency</option>
                      <option value="critical">Critical (0–6 hours)</option>
                      <option value="urgent">Urgent (6–24 hours)</option>
                      <option value="normal">Normal (24+ hours)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Hospital / Facility</label>
                  <Input
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="Facility name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <Input
                    name="contact"
                    type="tel"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location (Search or Manual)</label>
                  <LocationAutocomplete
                    value={formData.location}
                    onChange={(loc) => setFormData((prev) => ({ ...prev, location: loc }))}
                  />
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Any specific details or conditions"
                  ></textarea>
                </div>

                {/* ✅ Confirmation Dialog */}
                <Button
                  type="button"
                  className="w-full"
                  disabled={loading}
                  onClick={() => setConfirmOpen(true)}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>

                <AlertDialog
                  open={confirmOpen}
                  onClose={() => setConfirmOpen(false)}
                  title="Confirm Submission"
                  description="Are you sure you want to submit this blood request? Please verify your details."
                  onConfirm={() => {
                    handleSubmit();
                    setConfirmOpen(false);
                  }}
                  confirmText="Confirm"
                  cancelText="Cancel"
                />
              </form>
            </CardContent>
          </Card>

          {/* Available Inventory */}
          <div className="inventory-section">
            <Card>
              <CardHeader>
                <CardTitle>Available Nearby</CardTitle>
              </CardHeader>
              <CardContent>
                {availableInventory.map((item, index) => (
                  <div key={index} className="inventory-item">
                    <div className="inventory-top">
                      <span className="blood-badge">
                        <FaTint className="icon" /> {item.bloodType}
                      </span>
                      <span className="units">{item.units} units</span>
                    </div>
                    <div className="inventory-bottom">
                      <FaMapMarkerAlt className="icon" /> {item.location}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="hotline-card">
              <CardContent>
                <div className="hotline">
                  <FaPhone className="hotline-icon" />
                  <div>
                    <h4>Emergency Hotline</h4>
                    <p>For critical emergencies, call 24/7:</p>
                    <p className="hotline-number">1-800-BLOOD-911</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestBlood;
