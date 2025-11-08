import React, { useEffect, useCallback } from "react";
import "./styles/Alertdialog.css";

const AlertDialog = ({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // ✅ "default" | "success" | "error" | "warning"
  autoCloseOnConfirm = true, // ✅ optional improvement
}) => {
  // ✅ Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  // ✅ Handle ESC key to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    },
    [onClose, open]
  );

  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // ✅ Close on confirm (optional)
  const handleConfirm = () => {
    if (autoCloseOnConfirm) onClose();
    if (onConfirm) onConfirm();
  };

  if (!open) return null;

  return (
    <div
      className="alert-dialog-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`alert-dialog ${variant}`}
        onClick={(e) => e.stopPropagation()} // Prevent accidental close
      >
        {/* ===== Title ===== */}
        <h3 className="alert-dialog-title">{title}</h3>

        {/* ===== Description ===== */}
        {description && (
          <p className="alert-dialog-description">{description}</p>
        )}

        {/* ===== Footer Buttons ===== */}
        <div className="alert-dialog-footer">
          <button
            className="alert-dialog-btn cancel"
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className="alert-dialog-btn confirm"
            onClick={handleConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
