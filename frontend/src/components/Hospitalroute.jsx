import React from "react";
import { Navigate } from "react-router-dom";

const HospitalRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  if (!token) return <Navigate to="/hospital-login" replace />;
  if (role !== "hospital") {
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/donor" replace />;
  }

  return children;
};

export default HospitalRoute;
