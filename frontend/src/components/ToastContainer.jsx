import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useContext(NotificationContext);

  return (
    <div
      style={{
        position: "fixed",
        top: "85px", // sits nicely below navbar
        right: "20px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none", // click-through empty space
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: "rgba(30, 41, 59, 0.95)",
            backdropFilter: "blur(12px)",
            borderLeft: "4px solid var(--accent, #f59e0b)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
            minWidth: "300px",
            maxWidth: "360px",
            pointerEvents: "auto", // enable clicks on alert itself
            animation: "slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            color: "white"
          }}
        >
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "2px",
              display: "flex",
              alignItems: "center"
            }}
          >
            ✕
          </button>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", fontWeight: "700", color: "#f59e0b" }}>{toast.title}</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.4" }}>{toast.message}</p>
        </div>
      ))}
      <style>{`
        @keyframes slideInToast {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
