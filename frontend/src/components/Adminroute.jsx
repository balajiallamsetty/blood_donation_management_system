import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  if (!token) return <Navigate to="/admin-login" replace />;
  if (role !== "admin") {
    if (role === "hospital") return <Navigate to="/hospital" replace />;
    return <Navigate to="/donor" replace />;
  }

  return children;
};

export default AdminRoute;
