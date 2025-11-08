import React, { useEffect, useState } from "react";
import { FaTint, FaUser, FaMapMarkerAlt, FaClock, FaPhone, FaStickyNote } from "react-icons/fa";
import { getAllRequests, updateRequestStatus } from "../api/requestapi";
import http from "../api/Http";
import { Card, CardHeader, CardContent, CardTitle } from "../components/Card";
import Button from "../components/Button";
import useAuthStore from "../store/useAuthStore";
import "../styles/Requestlist.css";

const RequestsList2 = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = useAuthStore((s) => s.role);
  const me = useAuthStore((s) => s.user);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getAllRequests();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();

    const newId = sessionStorage.getItem("newRequestId");
    if (newId) setTimeout(() => sessionStorage.removeItem("newRequestId"), 3000);
    
    // Subscribe to SSE for real-time updates
    let es;
    try {
      const base = http?.defaults?.baseURL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";
      es = new EventSource(`${base}/requests/stream`);
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (!evt || !evt.type) return;
          if (evt.type === 'request.created') {
            setRequests((prev) => [evt.data, ...prev]);
            try { sessionStorage.setItem('newRequestId', evt.data?._id); } catch (e) { void e; }
            setTimeout(() => { try { sessionStorage.removeItem('newRequestId'); } catch (e) { void e; } }, 3000);
          } else if (evt.type === 'request.updated' || evt.type === 'request.fulfilled') {
            setRequests((prev) => prev.map((r) => (r._id === evt.data._id ? evt.data : r)));
          }
        } catch (e) { void e; }
      };
      es.onerror = () => {
        // Connection might drop in dev when server restarts; ignore silently
      };
    } catch (e) { void e; }

    return () => {
      if (es) { try { es.close(); } catch (e) { void e; } }
    };
  }, []);

  const handleMarkFulfilled = async (id) => {
    try {
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status: "fulfilled" } : r)));
      await updateRequestStatus(id, "fulfilled");
    } catch (err) {
      console.error("Failed to update status:", err);
      try {
        const data = await getAllRequests();
        setRequests(data);
      } catch (_err) {
        // non-fatal, will remain in optimistic state
        void _err;
      }
    }
  };

  const highlightId = typeof window !== "undefined" ? sessionStorage.getItem("newRequestId") : null;

  return (
    <div className="requests-page">
      <div className="container">
        <div className="header">
          <h1>Blood Requests</h1>
          <p>List of active and fulfilled blood requests submitted through the system</p>
        </div>
        {loading ? (
          <p className="loading-text">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="no-requests">No blood requests found.</p>
        ) : (
          <div className="requests-grid">
            {requests.map((req) => (
              <Card
                key={req._id}
                className={`request-card ${highlightId === req._id ? "request-card-highlight" : ""}`}
              >
                <CardHeader>
                  <CardTitle>
                    <div className="card-title-row">
                      <span className="blood-badge">
                        <FaTint className="icon" /> {req.bloodType || "N/A"}
                      </span>
                      {req.urgency && (
                        <span className={`urgency-badge urgency-${req.urgency}`}>{req.urgency}</span>
                      )}
                      <span
                        className={`status-badge ${
                          req.status === "fulfilled"
                            ? "fulfilled"
                            : req.status === "open"
                            ? "open"
                            : "pending"
                        }`}
                      >
                        {req.status || "open"}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="request-details">
                    {req.patientName && (
                      <p>
                        <FaUser className="detail-icon" /> <strong>Patient:</strong>{" "}
                        {req.patientName}
                      </p>
                    )}
                    <p>
                      <FaUser className="detail-icon" /> <strong>Requested By:</strong>{" "}
                      {req.requester?.name || "Unknown"}
                    </p>
                    <p>
                      <FaTint className="detail-icon" /> <strong>Blood Type:</strong>{" "}
                      {req.bloodType || "N/A"}
                    </p>
                    <p>
                      <strong>Units Required:</strong> {req.units ?? req.unitsNeeded ?? "N/A"} units
                    </p>
                    <p>
                      <FaMapMarkerAlt className="detail-icon" /> <strong>Hospital / Facility:</strong>{" "}
                      {req.hospitalName || "Not specified"}
                    </p>
                    <p>
                      <FaPhone className="detail-icon" /> <strong>Contact:</strong>{" "}
                      {req.contact || req.contactNumber || "+91 XXXXX XXXXX"}
                    </p>
                    {req.urgency && (
                      <p>
                        <FaClock className="detail-icon" /> <strong>Urgency:</strong>{" "}
                        {req.urgency}
                      </p>
                    )}
                    {req.notes && (
                      <p>
                        <FaStickyNote className="detail-icon" /> <strong>Notes:</strong>{" "}
                        {req.notes}
                      </p>
                    )}
                    {req.createdAt && (
                      <p>
                        <FaClock className="detail-icon" /> <strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="card-actions">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {req.status === "open" && (role === "donor" || (me && req.requester && (req.requester._id === me._id))) && (
                      <Button size="sm" onClick={() => handleMarkFulfilled(req._id)}>
                        {role === "donor" ? "Mark as Fulfilled" : "Close as Fulfilled"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsList2;
