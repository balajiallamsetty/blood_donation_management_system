import React, { useState, useEffect, useCallback } from "react";
import { FaTint, FaUserShield } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/Card";
import { loginUser } from "../api/Authapi";
import Alert from "../components/Alert";
import "../styles/Auth.css";

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: "", message: "" });
  const navigate = useNavigate();

  const redirectBasedOnRole = useCallback(
    (role) => {
      const normalized = (role || "").toLowerCase();
      if (normalized === "admin") navigate("/admin");
      else if (normalized === "hospital") navigate("/hospital");
      else if (normalized === "donor") navigate("/donor");
      else navigate("/");
    },
    [navigate]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) redirectBasedOnRole(role);
  }, [redirectBasedOnRole]);

  useEffect(() => {
    if (!alert.visible) return;
    const timer = setTimeout(() => setAlert({ visible: false, type: "", message: "" }), 3000);
    return () => clearTimeout(timer);
  }, [alert.visible]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginUser({
        email: e.target.email.value,
        password: e.target.password.value,
      });

      const role = (res.user.role || "").toLowerCase();
      if (role !== "admin") {
        setAlert({
          visible: true,
          type: "error",
          message:
            role === "hospital"
              ? "Hospital admins must use the Hospital Admin Login page."
              : "This account does not have admin privileges.",
        });
        return;
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", role);
      localStorage.setItem("userName", res.user.name || "");

      setAlert({ visible: true, type: "success", message: "Welcome back, Admin! Redirecting..." });
      setTimeout(() => redirectBasedOnRole(role), 1200);
    } catch (err) {
      setAlert({
        visible: true,
        type: "error",
        message: err.response?.data?.message || "Login failed! Please verify your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="logo">
            <FaTint className="logo-icon" />
            <span className="logo-text">BloodConnect</span>
          </Link>
          <p className="subtitle">System administrator access</p>
        </div>

        {alert.visible && (
          <div className="alert-box">
            <Alert
              type={alert.type}
              title={alert.type === "success" ? "Success" : "Error"}
              description={alert.message}
            />
          </div>
        )}

        <Card className="auth-card">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Manage platform-wide approvals and oversee operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Admin Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="admin@bloodconnect.com"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <Input name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="auth-links">
              <FaUserShield className="role-icon admin-icon" />
              <div>
                <p>Looking for a different portal?</p>
                <p>
                  <Link to="/auth">Donor Sign In</Link>
                  {" • "}
                  <Link to="/hospital-login">Hospital Admin Login</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
