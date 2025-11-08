import React, { useState, useEffect, useCallback } from "react";
import { FaTint, FaHospital } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/Card";
import { loginUser } from "../api/Authapi";
import Alert from "../components/Alert";
import "../styles/Auth.css";

const HospitalLogin = () => {
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
      if (role !== "hospital") {
        setAlert({
          visible: true,
          type: "error",
          message:
            role === "admin"
              ? "System admins must use the Admin Login page."
              : "This account is not registered as a hospital admin.",
        });
        return;
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", role);
      localStorage.setItem("userName", res.user.name || "");

      setAlert({ visible: true, type: "success", message: "Hospital access granted! Redirecting..." });
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
          <p className="subtitle">Hospital administrator access</p>
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
            <CardTitle>Hospital Admin Login</CardTitle>
            <CardDescription>Manage your hospital profile, inventory, and requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Hospital Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="hospital@bloodconnect.com"
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
              <FaHospital className="role-icon hospital-icon" />
              <div>
                <p>Need a different portal?</p>
                <p>
                  <Link to="/auth">Donor Sign In</Link>
                  {" • "}
                  <Link to="/admin-login">Admin Login</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalLogin;
