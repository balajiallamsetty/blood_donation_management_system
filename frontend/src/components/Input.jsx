import React from "react";
import "./styles/Input.css";

const Input = React.forwardRef(({ type = "text", className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={`custom-input ${className}`}
      {...props}
    />
  );
});

export default Input;
