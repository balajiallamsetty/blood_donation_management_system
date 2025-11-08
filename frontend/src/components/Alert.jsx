import React from "react";
import "./styles/Alert.css";

const Alert = ({ type = "default", title, description, message, icon }) => {
  const resolvedDescription = description || message;

  return (
    <div className={`alert ${type}`}>
      {icon && <span className="alert-icon">{icon}</span>}
      <div className="alert-content">
        {title && <h5 className="alert-title">{title}</h5>}
        {resolvedDescription && <p className="alert-description">{resolvedDescription}</p>}
      </div>
    </div>
  );
};

export default Alert;
