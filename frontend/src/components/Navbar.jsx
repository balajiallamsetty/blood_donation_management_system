import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTint,
  FaHome,
  FaUserPlus,
  FaHeart,
  FaTachometerAlt,
  FaListAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaHospital,
  FaUserShield,
} from "react-icons/fa";
import Button from "./Button";
import AlertDialog from "./Alertdialog";
import "./styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  // ✅ Retrieve login info
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase(); // normalize
  const userName = localStorage.getItem("userName");

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // ✅ Logout logic (fixed)
  const handleLogout = () => {
    // 1️⃣ Clear user session
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");

    // 2️⃣ Close the logout dialog immediately
    setShowLogoutDialog(false);

    // 3️⃣ Navigate home after slight delay for smooth UX
    setTimeout(() => navigate("/"), 200);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* ===== Logo ===== */}
          <NavLink to="/" className="navbar-logo">
            <FaTint className="navbar-icon" />
            <span className="navbar-brand">BloodConnect</span>
          </NavLink>

          {/* ===== Navigation Links ===== */}
          <div className="navbar-links">
            {/* Common: Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <FaHome className="nav-icon" /> Home
            </NavLink>

            {/* Donor-specific links */}
            {role === "donor" && (
              <>
                <NavLink
                  to="/donor"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <FaUserPlus className="nav-icon" /> Donor Portal
                </NavLink>

                <NavLink
                  to="/request"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <FaHeart className="nav-icon" /> Request Blood
                </NavLink>
              </>
            )}

            {/* Admin-specific link */}
            {role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FaTachometerAlt className="nav-icon" /> Admin Dashboard
              </NavLink>
            )}

            {/* Hospital admin link */}
            {role === "hospital" && (
              <NavLink
                to="/hospital"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FaHospital className="nav-icon" /> Hospital Dashboard
              </NavLink>
            )}

            {/* Common: View Requests */}
            <NavLink
              to="/requests"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <FaListAlt className="nav-icon" /> View Requests
            </NavLink>

            {/* ===== Auth Section ===== */}
            {!token && (
              <div className="navbar-auth-links">
                <NavLink
                  to="/auth"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <FaSignInAlt className="nav-icon" /> Donor Sign In
                </NavLink>
                <NavLink
                  to="/admin-login"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <FaUserShield className="nav-icon" /> Admin Login
                </NavLink>
                <NavLink
                  to="/hospital-login"
                  className={({ isActive }) =>
                    isActive ? "nav-link active cta" : "nav-link cta"
                  }
                >
                  <FaHospital className="nav-icon" /> Hospital Login
                </NavLink>
              </div>
            )}

            {/* ===== When logged in ===== */}
            {token && (
              <div className="navbar-user">
                <span className="welcome-text">
                  Welcome, <strong>{userName || "User"}</strong>{" "}
                  <span className="role-text">
                    ({role === "admin" ? "Admin" : role === "hospital" ? "Hospital Admin" : "Donor"})
                  </span>
                </span>

                <Button
                  size="sm"
                  variant="neutral"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <FaSignOutAlt className="nav-icon" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ===== Logout Confirmation Dialog ===== */}
      <AlertDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out from your account?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  );
};

export default Navbar;
