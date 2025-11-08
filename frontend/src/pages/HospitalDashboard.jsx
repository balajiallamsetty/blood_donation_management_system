import React, { useEffect, useMemo, useState } from "react";
import { Link } from 'react-router-dom';
// Stable constants outside component
const BLOOD_GROUPS = Object.freeze(['O','A','B','AB']);
const RH = Object.freeze(['+','-']);
import { FaTint, FaClock, FaClipboardList, FaWarehouse } from "react-icons/fa";
import { Card, CardHeader, CardContent, CardTitle } from "../components/Card";
import Alert from "../components/Alert";
import Button from "../components/Button";
import {
  getHospital,
  getMyHospital,
  getHospitalInventory,
  listRequests,
  updateRequestStatus,
  fulfillRequest,
  getInventoryLogs,
  getInventoryExpiry
} from "../api/HospitalApi";
import useAuthStore from "../store/useAuthStore";
import "../styles/Admindashboard.css"; // reuse grid styles
import "../styles/HospitalDashboard.css"; // subnavbar + layout alignment

const HospitalDashboard = () => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState({ visible: false, type: "", message: "" });

  // Derived (fallback to localStorage role for cases where zustand user not populated)
  const storedRole = (localStorage.getItem('role') || '').toLowerCase();
  const hospitalId = user?.hospitalId || hospital?._id;

  // Initial + on user change load (simplified: avoid loop on setting hospital)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let id = hospitalId;
        // Fallback: if no id yet but role indicates hospital via store OR localStorage
        if (!id && (user?.role === 'hospital' || storedRole === 'hospital')) {
          const hMe = await getMyHospital();
          setHospital(hMe);
          id = hMe?._id;
          if (id) localStorage.setItem('hospitalId', id);
        }
        if (id && !hospital) {
          const h = await getHospital(id);
          setHospital(h);
        }
        if (id) {
          // Load inventory and expiry (public)
          const [inv, exp] = await Promise.all([
            getHospitalInventory(id),
            getInventoryExpiry(id)
          ]);
          setInventory(inv || []);
          setExpiry(exp || []);
          // Load logs (requires auth/ownership) but don't fail the whole load if 401/403
          try {
            const log = await getInventoryLogs(id, 25);
            setLogs(log || []);
          } catch (e) {
            console.warn('Skipping logs load (auth/ownership likely):', e?.response?.status || e?.message);
            setLogs([]);
          }
        }
        const reqs = await listRequests();
        setRequests(reqs || []);
      } catch (e) {
        console.error(e);
        setAlertData({ visible: true, type: 'destructive', message: 'Failed to load hospital data.' });
      } finally {
        setLoading(false);
      }
    };
    load();
    // We intentionally exclude `hospital` from deps to avoid infinite loop after setting it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, user?.role, user?._id, storedRole]);

  // Listen for inventory updates from Manage Inventory and auto-refresh panels
  useEffect(() => {
    if (!hospitalId) return;
    const handler = async () => {
      const [inv, exp, log] = await Promise.all([
        getHospitalInventory(hospitalId),
        getInventoryExpiry(hospitalId),
        getInventoryLogs(hospitalId, 25)
      ]);
      setInventory(inv || []);
      setExpiry(exp || []);
      setLogs(log || []);
    };
    window.addEventListener('inventoryUpdated', handler);
    return () => window.removeEventListener('inventoryUpdated', handler);
  }, [hospitalId]);

  // Derived inventory matrix (always show all combinations)
  const matrix = useMemo(() => {
    const keyMap = new Map();
    inventory.forEach(i => keyMap.set(i.bloodGroup + i.rh, i));
    return BLOOD_GROUPS.flatMap(bg => RH.map(rh => {
      const existing = keyMap.get(bg + rh);
      const units = existing ? Number(existing.units) || 0 : 0;
      let level = 'ok';
      if (units <= 2) level = 'low';
      else if (units <= 5) level = 'moderate';
      return existing ? { ...existing, units, level } : { _id: bg + rh, bloodGroup: bg, rh, units, level };
    }));
  }, [inventory]);
  const totalUnits = useMemo(() => inventory.reduce((s,i) => s + (Number(i.units)||0),0), [inventory]);

  // Helpers
  const showAlert = (type, message) => setAlertData({ visible: true, type, message });

  // Removed adjustInventory controls for display-only overview

  const markRequestStatus = async (id, status) => {
    try {
      const updated = await updateRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      showAlert('success', `Request marked ${status}`);
    } catch (e) {
      console.error(e);
      showAlert('destructive', 'Failed to update request');
    }
  };

  const fulfillReq = async (reqObj, units) => {
    if (!hospitalId) return;
    try {
      const resp = await fulfillRequest(reqObj._id, hospitalId, units);
      setRequests((prev) => prev.map((r) => (r._id === resp.request._id ? resp.request : r)));
      showAlert('success', 'Request fulfilled');
    } catch (e) {
      console.error(e);
      showAlert('destructive', 'Fulfill failed (insufficient inventory?)');
    }
  };

  useEffect(() => {
    if (!alertData.visible) return;
    const timer = setTimeout(() => setAlertData({ visible: false, type: "", message: "" }), 3000);
    return () => clearTimeout(timer);
  }, [alertData.visible]);

  return (
    <div className="hospital-dashboard">
      {/* ================= SUB NAVBAR (Page-level) ================= */}
      <nav className="subnavbar">
        <div className="container subnavbar-container">
          <div className="subnavbar-left">
            <img src="/favicon.png" alt="Logo" className="logo" />
            <h2 className="subnavbar-title">{hospital?.name || 'Hospital'}</h2>
          </div>
          <ul className="subnav-links">
            <li className="subnav-link active">Dashboard</li>
            <li className="subnav-link"><Link to="/hospital/inventory">Inventory</Link></li>
            <li className="subnav-link"><Link to="/hospital/settings">Settings</Link></li>
            <li className="subnav-link">History</li>
          </ul>
        </div>
      </nav>

      {/* ================= ALERT ================= */}
      {alertData.visible && <Alert type={alertData.type} message={alertData.message} />}

      {/* ================= DASHBOARD ================= */}
      <div className="dashboard-content container">
        <div className="dashboard-header">
          <h1>Hospital Inventory Dashboard</h1>
          <p className="subtitle">Manage inventory, fulfill requests, and monitor activity.</p>
        </div>
        {loading && <p>Loading data...</p>}

        {/* INVENTORY SUMMARY */}
        <div className="stats-grid">
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <FaWarehouse /> Inventory Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <strong>Total Units: {totalUnits}</strong>
              </div>
              <div className="hd-inventory-grid">
                {matrix.map(item => (
                  <div key={item._id} className={`stock-card level-${item.level}`}>
                    <div className="title">{item.bloodGroup}{item.rh}</div>
                    <div className="units">{item.units} Units</div>
                    <div className="progress-line"><span></span></div>
                    <small className="level-label">{item.level==='low'? 'Low stock' : item.level==='moderate'? 'Moderate' : 'Healthy'}</small>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* BLOOD EXPIRY TRACKING */}
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <FaClock /> Blood Expiry Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiry.length === 0 ? <p>No inventory yet.</p> : (
                <div className="expiry-list">
                  {expiry.sort((a,b)=> (a.remainingDays - b.remainingDays)).map(e => (
                    <div key={e.bloodGroup+e.rh} className="expiry-item">
                      <div className="info">
                        <span className={`status-dot ${e.status==='critical' ? 'dot-critical' : e.status==='warning' ? 'dot-warning' : 'dot-ok'}`}></span>
                        <div>
                          <div><strong>{e.bloodGroup}{e.rh}</strong> · {e.units} units</div>
                          <small className="level-label">Expires in {e.remainingDays} days</small>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Prioritize</Button>
                    </div>
                  ))}
                </div>
              )}
              <small className="level-label">Shelf life approximation: 42 days from last update.</small>
            </CardContent>
          </Card>

          {/* INVENTORY LOG */}
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <FaClipboardList /> Inventory Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? <p>No changes recorded yet.</p> : (
                <div className="log-list">
                  {logs.map(l => (
                    <div key={l._id} className={`log-item ${l.action==='replace' ? 'warn' : (l.deltaUnits>=0 ? 'success' : 'error')}`}>
                      <strong>{l.bloodGroup}{l.rh}</strong> {l.action === 'replace' ? 'set to' : (l.deltaUnits>0? '+':'') + l.deltaUnits} units → <em>{l.newUnits} units</em>
                      <span className="log-meta">{new Date(l.at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {hospitalId && <Button variant="secondary" onClick={async ()=>{
                const fresh = await getInventoryLogs(hospitalId,25);
                setLogs(fresh||[]);
              }}>Refresh Logs</Button>}
            </CardContent>
          </Card>

          {/* PENDING REQUESTS */}
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <FaTint /> Pending Blood Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.filter(r => r.status === 'open').length === 0 ? (
                <p>No open requests.</p>
              ) : (
                <table className="req-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Blood</th>
                      <th>Units</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => r.status === 'open').map((req) => (
                      <tr key={req._id}>
                        <td>{new Date(req.createdAt || Date.now()).toLocaleDateString()}</td>
                        <td>{req.bloodType}</td>
                        <td>{req.units}</td>
                        <td><span className="pill pill-yellow">Open</span></td>
                        <td>
                          <Button size="sm" onClick={() => fulfillReq(req, req.units)}>Fulfill</Button>{' '}
                          <Button size="sm" variant="outline" onClick={() => markRequestStatus(req._id, 'pending')}>Pending</Button>{' '}
                          <Button size="sm" variant="destructive" onClick={() => markRequestStatus(req._id, 'cancelled')}>Cancel</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
