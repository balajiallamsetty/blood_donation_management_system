import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaTint,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBell,
  FaCheck,
  FaPlusCircle,
} from "react-icons/fa";
import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardHeader, CardContent, CardTitle } from "../components/Card";
import Alert from "../components/Alert";
import LocationAutocomplete from "../components/LocationAutocomplete";
import {
  getMyProfile,
  updateMyProfile,
  getDonationHistory,
  recordDonation,
  getAlerts,
} from "../api/DonorApi";
import "../styles/DonorPortal.css";

const DonorPortal = () => {
  const [donor, setDonor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationValue, setLocationValue] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [resolvingLabel, setResolvingLabel] = useState(false);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const resolveLocationLabel = useCallback(
    async (coords) => {
      if (!coords || coords.lat == null || coords.lng == null) {
        return null;
      }
      if (!googleApiKey) {
        return null;
      }

      try {
        setResolvingLabel(true);
        const query = new URLSearchParams({
          latlng: `${coords.lat},${coords.lng}`,
          key: googleApiKey,
        });
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`
        );
        if (!response.ok) {
          throw new Error(`Geocode request failed with status ${response.status}`);
        }
        const data = await response.json();
        const label = data?.results?.[0]?.formatted_address || "";
        if (label) {
          setLocationLabel(label);
          setLocationValue((prev) => {
            if (prev && prev.lat === coords.lat && prev.lng === coords.lng) {
              if (prev.label === label) return prev;
              return { ...prev, label };
            }
            return prev ?? { ...coords, label };
          });
          return label;
        }
        return null;
      } catch (error) {
        console.error("Failed to resolve location label", error);
        return null;
      } finally {
        setResolvingLabel(false);
      }
    },
    [googleApiKey]
  );

  const hydrateLocationState = useCallback(
    (profile, fallbackLabel = "") => {
      const loc = profile?.location;
      if (!loc) {
        setLocationValue(null);
        setLocationLabel("");
        setResolvingLabel(false);
        return;
      }

      const nextLocation = {
        ...(typeof loc === "object" ? loc : {}),
      };

      if (loc.label) {
        setLocationLabel(loc.label);
        setLocationValue(nextLocation);
        setResolvingLabel(false);
        return;
      }

      if (loc.city) {
        setLocationLabel(loc.city);
        setLocationValue(nextLocation);
        setResolvingLabel(false);
        return;
      }

      if (fallbackLabel) {
        setLocationLabel(fallbackLabel);
        setLocationValue({ ...nextLocation, label: fallbackLabel });
        setResolvingLabel(false);
        return;
      }

      setLocationValue(nextLocation);

      if (loc.lat != null && loc.lng != null) {
        resolveLocationLabel({ lat: loc.lat, lng: loc.lng });
      } else {
        setLocationLabel("");
      }
    },
    [resolveLocationLabel]
  );

  const handleLocationChange = useCallback(
    (next) => {
      setLocationValue(next);
      if (!next) {
        setLocationLabel("");
        setResolvingLabel(false);
        return;
      }
      if (next.label) {
        setLocationLabel(next.label);
        setResolvingLabel(false);
      } else if (next.lat != null && next.lng != null) {
        resolveLocationLabel({
          lat: Number(next.lat),
          lng: Number(next.lng),
        });
      }
    },
    [resolveLocationLabel]
  );

  // ✅ Alert banners
  const [alertData, setAlertData] = useState({ visible: false, type: "", message: "" });

  // ✅ Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // ✅ Donation history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ✅ Donation request form toggle
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);

  const computeHospitalDisplay = useCallback((entry) => {
    if (!entry) return "—";
    const { hospital, hospitalName } = entry;

    if (typeof hospital === "string" && hospital.trim()) {
      return hospital.trim();
    }

    if (hospital && typeof hospital === "object" && hospital.name) {
      const resolved = typeof hospital.name === "string" ? hospital.name : "";
      if (resolved.trim()) return resolved.trim();
    }

    if (typeof hospitalName === "string" && hospitalName.trim()) {
      return hospitalName.trim();
    }

    return "—";
  }, []);

  const normalizeHistory = useCallback(
    (items) =>
      (Array.isArray(items) ? items : []).map((entry) => ({
        ...entry,
        hospitalDisplay: computeHospitalDisplay(entry),
      })),
    [computeHospitalDisplay]
  );

  const refreshHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const list = await getDonationHistory();
      setHistory(normalizeHistory(list));
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, [normalizeHistory]);

  // Auto-hide banner alert
  useEffect(() => {
    if (alertData.visible) {
      const t = setTimeout(() => setAlertData((a) => ({ ...a, visible: false })), 4000);
      return () => clearTimeout(t);
    }
  }, [alertData]);

  // Fetch profile
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        setDonor(data);
        hydrateLocationState(data);
      } catch (err) {
        console.error(err);
        setAlertData({
          visible: true,
          type: "error",
          message: "Failed to load profile. Please log in again.",
        });
      }
    })();
  }, [hydrateLocationState]);

  // Fetch donation history
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Fetch notifications
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setNotifLoading(true);
        const items = await getAlerts();
        const normalized = Array.isArray(items)
          ? items.map((item) => ({
              ...item,
              id: item.id ?? item._id ?? String(Math.random()),
              read: Boolean(item.read),
            }))
          : [];
        setNotifications(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 20000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updates = {
      name: e.target.name.value,
      phone: e.target.phone.value,
      bloodGroup: e.target.bloodGroup.value,
    };

    if (locationValue && (locationValue.lat == null || locationValue.lng == null)) {
      setAlertData({
        visible: true,
        type: "error",
        message: "Please choose a location with both latitude and longitude.",
      });
      setLoading(false);
      return;
    }

    if (locationValue) {
      const lat = Number(locationValue.lat);
      const lng = Number(locationValue.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setAlertData({
          visible: true,
          type: "error",
          message: "Latitude and longitude must be numeric values.",
        });
        setLoading(false);
        return;
      }
      updates.location = {
        lat,
        lng,
      };
      if (locationValue.label) {
        updates.location.label = locationValue.label;
      }
    } else if (locationValue === null) {
      updates.location = null;
    }
    try {
  const updated = await updateMyProfile(updates);
  setDonor(updated);
  hydrateLocationState(updated, locationValue?.label || locationLabel || "");
      setIsEditing(false);
      setAlertData({
        visible: true,
        type: "success",
        message: "Profile updated successfully!",
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        visible: true,
        type: "error",
        message: "Profile update failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🩸 Handle new donation verification request
  const handleDonationRequest = async (e) => {
    e.preventDefault();
    setDonationLoading(true);
    const form = e.target;
    const hospitalInput = form.hospital.value.trim();
    const locationInput = form.location.value.trim();
    const unitsValue = Number(form.units.value);

    if (!Number.isFinite(unitsValue) || unitsValue <= 0) {
      setAlertData({
        visible: true,
        type: "error",
        message: "Please enter the donated units as a positive number.",
      });
      setDonationLoading(false);
      return;
    }

    const payload = {
      location: locationInput,
      units: unitsValue,
    };

    if (hospitalInput) {
      payload.hospital = hospitalInput;
    }
    try {
      const response = await recordDonation(payload);
      setAlertData({
        visible: true,
        type: "success",
        message:
          response?.message || "Donation recorded and pending verification.",
      });
      form.reset();
      setShowRequestForm(false);
      await refreshHistory();
    } catch (err) {
      console.error(err);
      setAlertData({
        visible: true,
        type: "error",
        message:
          err?.response?.data?.message || "Failed to record donation.",
      });
    } finally {
      setDonationLoading(false);
    }
  };

  if (!donor) return <p className="loading-text">Loading profile...</p>;

  return (
    <div className="donor-page">
      <div className="container">
        <div className="header">
          <h1>Donor Portal</h1>
          <p>Manage your profile, alerts, and donation history</p>
        </div>

        {/* ✅ Alert Banner */}
        {alertData.visible && (
          <div className="alert-container">
            <Alert
              type={alertData.type}
              title={alertData.type === "success" ? "Success" : "Error"}
              description={alertData.message}
            />
          </div>
        )}

        <div className="grid grid-2">
          {/* ===== LEFT COLUMN ===== */}
          <div className="col">
            {/* Profile Card */}
            <Card className="profile-card">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="profile-info">
                    <div className="info-row">
                      <span>Name:</span> <strong>{donor.name}</strong>
                    </div>
                    <div className="info-row">
                      <span>Blood Group:</span>
                      <div className="badge">
                        <FaTint className="icon" /> {donor.bloodGroup}
                      </div>
                    </div>
                    <div className="info-row">
                      <FaEnvelope className="icon" /> {donor.email}
                    </div>
                    <div className="info-row">
                      <FaPhone className="icon" /> {donor.phone || "N/A"}
                    </div>
                    <div className="info-row">
                      <FaMapMarkerAlt className="icon" />{" "}
                      {locationLabel
                        || (donor.location?.lat != null && donor.location?.lng != null
                          ? "Location saved"
                          : "Not specified")}
                      {resolvingLabel && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          Resolving address…
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setIsEditing(true);
                        hydrateLocationState(donor, locationLabel);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <form className="form" onSubmit={handleUpdate}>
                    <div className="form-group">
                      <label>Name</label>
                      <Input defaultValue={donor.name} name="name" />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <Input defaultValue={donor.phone} name="phone" />
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <Input defaultValue={donor.bloodGroup} name="bloodGroup" />
                    </div>
                    <LocationAutocomplete
                      value={locationValue}
                      onChange={handleLocationChange}
                      disabled={loading}
                    />
                    <div className="button-group">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          hydrateLocationState(donor, locationLabel);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stats-grid">
                <Card>
                  <CardContent>
                    <h2 className="stat-value">{history.length}</h2>
                    <p className="stat-label">Total Donations</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h2 className="stat-value">
                      {history[0]?.date?.slice(0, 10) || "—"}
                    </h2>
                    <p className="stat-label">Last Donation</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h2 className="stat-value">
                      {history[0]?.verified
                        ? new Date(
                            new Date(history[0].date).setDate(
                              new Date(history[0].date).getDate() + 90
                            )
                          ).toLocaleDateString()
                        : "—"}
                    </h2>
                    <p className="stat-label">Next Eligible Date</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Request Verification Section */}
            <Card className="request-card">
              <CardHeader>
                <CardTitle>
                  <FaPlusCircle className="icon" style={{ marginRight: 8 }} />{" "}
                  Request Donation Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showRequestForm ? (
                  <Button onClick={() => setShowRequestForm(true)}>
                    + New Verification Request
                  </Button>
                ) : (
                  <form className="form" onSubmit={handleDonationRequest}>
                    <div className="form-group">
                      <label>Hospital / Center Name</label>
                      <Input name="hospital" placeholder="e.g., City Blood Bank" />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <Input name="location" required placeholder="e.g., Guntur" />
                    </div>
                    <div className="form-group">
                      <label>Units Donated (ml)</label>
                      <Input
                        type="number"
                        name="units"
                        required
                        placeholder="350"
                        min="1"
                        step="1"
                      />
                    </div>
                    <div className="button-group">
                      <Button type="submit" disabled={donationLoading}>
                        {donationLoading ? "Submitting..." : "Submit Donation"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="col">
            {/* Alerts */}
            <Card className="alerts-card">
              <CardHeader>
                <CardTitle className="alerts-title">
                  <FaBell style={{ marginRight: 8 }} /> Alerts
                  {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifLoading ? (
                  <p>Loading alerts…</p>
                ) : notifications.length === 0 ? (
                  <p className="muted">No alerts available.</p>
                ) : (
                  <ul className="alerts-list">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`alert-item ${n.read ? "read" : "unread"}`}
                      >
                        <div className="alert-main">
                          <div className="alert-top">
                            <span className="alert-type">
                              {n.type || "Blood Request"}
                            </span>
                            <span className="alert-time">{n.timeAgo || ""}</span>
                          </div>
                          <div className="alert-body">
                            {n.message ||
                              `Request for ${n.bloodGroup || "A+"} • Units: ${
                                n.units || 1
                              } • Urgency: ${n.urgency || "Normal"}`}
                          </div>
                        </div>
                        <div className="alert-actions">
                          {!n.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkRead(n.id)}
                            >
                              <FaCheck style={{ marginRight: 6 }} /> Mark read
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Donation History */}
            <Card className="history-card">
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p>Loading history…</p>
                ) : history.length === 0 ? (
                  <p className="muted">No donations recorded yet.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Hospital</th>
                          <th>Units</th>
                          <th>Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row) => (
                          <tr key={row._id || row.id}>
                            <td>{row.date?.slice(0, 10) || "-"}</td>
                            <td>{row.hospitalDisplay}</td>
                            <td>{row.units ?? "-"}</td>
                            <td>
                              {typeof row.location === "string" && row.location.trim()
                                ? row.location.trim()
                                : "Not specified"}
                            </td>
                            <td>
                              <span
                                className={`chip ${
                                  row.status === "completed"
                                    ? "completed"
                                    : row.status === "pending"
                                    ? "pending"
                                    : "cancelled"
                                }`}
                              >
                                {row.status === "completed"
                                  ? "Verified"
                                  : row.status === "pending"
                                  ? "Pending"
                                  : "Cancelled"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorPortal;
