import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import DonorPortal from "./pages/DonorPortal.jsx";
import AdminDashboard from "./pages/Admindashboard.jsx";
import HospitalDashboard from "./pages/HospitalDashboard.jsx";
import HospitalInventory from "./pages/HospitalInventory.jsx";
import HospitalSettings from "./pages/HospitalSettings.jsx";
import AdminRoute from "./components/Adminroute.jsx";
import HospitalRoute from "./components/Hospitalroute.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import HospitalLogin from "./pages/HospitalLogin.jsx";
import RequestBlood from "./pages/Requestblood.jsx";
import RequestsList2 from "./pages/RequestsList2.jsx";
import NotFound from "./pages/Notfound.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/hospital-login" element={<HospitalLogin />} />
          <Route path="/donor" element={<DonorPortal />} />
          <Route
            path="/hospital"
            element={
              <HospitalRoute>
                <HospitalDashboard />
              </HospitalRoute>
            }
          />
          <Route
            path="/hospital/inventory"
            element={
              <HospitalRoute>
                <HospitalInventory />
              </HospitalRoute>
            }
          />
          <Route
            path="/hospital/settings"
            element={
              <HospitalRoute>
                <HospitalSettings />
              </HospitalRoute>
            }
          />
          <Route path="/request" element={<RequestBlood />} />
          <Route path="/requests" element={<RequestsList2 />} />

          {/* ✅ Protected Admin Route (only one definition) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;
