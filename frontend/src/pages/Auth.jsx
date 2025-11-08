import React, { useState, useEffect, useCallback } from "react";
import { FaTint, FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/Card";
import { signupUser, loginUser } from "../api/Authapi";
import Alert from "../components/Alert";
import "../styles/Auth.css";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      password: e.target.password.value,
      role: "donor",
      bloodGroup: "A+",
      phone: "0000000000",
    };
    try {
      const res = await signupUser(formData);
      const role = (res.user.role || "").toLowerCase();
      if (role !== "donor") {
        setAlert({
          visible: true,
          type: "error",
          message: "Only donor accounts can be created from this page.",
        });
        return;
      }
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", role);
      localStorage.setItem("userName", res.user.name || "");
      setAlert({ visible: true, type: "success", message: "Signup successful! Redirecting..." });
      setTimeout(() => redirectBasedOnRole(role), 1200);
    } catch (err) {
      setAlert({
        visible: true,
        type: "error",
        message: err.response?.data?.message || "Signup failed! Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = {
      email: e.target.email.value,
      password: e.target.password.value,
    };
    try {
      const res = await loginUser(formData);
      const role = (res.user.role || "").toLowerCase();
      if (role !== "donor") {
        setAlert({
          visible: true,
          type: "error",
          message:
            role === "admin"
              ? "Detected admin account. Please use the Admin Login page."
              : "Detected hospital admin account. Please use the Hospital Admin Login page.",
        });
        return;
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", role);
      localStorage.setItem("userName", res.user.name || "");

      setAlert({ visible: true, type: "success", message: "Login successful! Redirecting..." });
      setTimeout(() => redirectBasedOnRole(role), 1200);
    } catch (err) {
      setAlert({
        visible: true,
        type: "error",
        message: err.response?.data?.message || "Login failed! Please check credentials.",
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
          <p className="subtitle">Donor access • Sign in or create an account</p>
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
            <CardTitle>Donor Portal</CardTitle>
            <CardDescription>
              Manage donations, track requests, and stay connected with the community.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="tabs">
              <button
                className={`tab ${activeTab === "signin" ? "active" : ""}`}
                onClick={() => setActiveTab("signin")}
              >
                Sign In
              </button>
              <button
                className={`tab ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>

            {activeTab === "signin" ? (
              <form onSubmit={handleSignIn} className="form">
                <div className="form-group">
                  <label>Email</label>
                  <Input name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <Input name="password" type="password" required />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="form">
                <div className="form-group">
                  <label>Full Name</label>
                  <Input name="name" type="text" placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <Input name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <Input name="password" type="password" required />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="auth-links">
              <FaUserCircle className="role-icon user-icon" />
              <div>
                <p>Need elevated access?</p>
                <p>
                  <Link to="/admin-login">Go to Admin Login</Link>
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

export default Auth;
