import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
// Corrected path: styles directory is under src/styles (not src/../styles at root)
import "../styles/Notfound.css";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <h1>404</h1>
        <p>Oops! The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="home-link">
          ⬅ Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
