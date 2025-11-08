import React from "react";
import "./styles/Card.css";

const Card = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`card ${className}`} {...props} />
));

const CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`card-header ${className}`} {...props} />
));

const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={`card-title ${className}`} {...props} />
));

const CardDescription = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`card-description ${className}`} {...props} />
  )
);

const CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`card-content ${className}`} {...props} />
));

const CardFooter = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`card-footer ${className}`} {...props} />
));

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
