import React from "react";
import "./styles/Button.css";

const Button = React.forwardRef(
  ({ children, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const classNames = [
      "btn",
      `btn-${variant}`,
      `btn-${size}`,
      props.className || "",
    ]
      .filter(Boolean)
      .join(" ");

    // If asChild is true and child is a valid element (e.g., Link),
    // clone it so className and props land on the anchor/link itself.
    if (asChild && React.isValidElement(children)) {
      const child = children;
      const mergedClass = [classNames, child.props.className || ""].filter(Boolean).join(" ");
      return React.cloneElement(child, { className: mergedClass, ref, ...props });
    }

    const Comp = "button";
    return (
      <Comp ref={ref} className={classNames} {...props}>
        {children}
      </Comp>
    );
  }
);

export default Button;
