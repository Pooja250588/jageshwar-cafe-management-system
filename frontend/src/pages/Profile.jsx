import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="page-container" style={{ textAlign: "center" }}>
        <div className="form-card" style={{ padding: "4rem" }}>
          <span style={{ fontSize: "3rem" }}>🔒</span>
          <h2 style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>Access Denied</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Please log in or register to view your cafe profile dashboard.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="primary-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="secondary-btn" onClick={() => navigate("/register")}>
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get initials for profile avatar (strictly first & last letter, e.g., PW)
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDisplayName = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) return name;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const initials = getInitials(user.name);
  const displayName = getDisplayName(user.name);

  return (
    <div className="page-container">
      <div className="profile-card-custom" style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "24px",
        padding: "3rem 2rem",
        boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
        maxWidth: "480px",
        width: "100%",
        margin: "0 auto",
        textAlign: "center"
      }}>
        <div className="profile-avatar" style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6b35 0%, #ff9f43 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          fontWeight: "800",
          margin: "0 auto 1.5rem",
          boxShadow: "0 8px 20px rgba(255, 107, 53, 0.35)",
          border: "3px solid rgba(255, 255, 255, 0.15)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "default"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(255, 107, 53, 0.45)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 107, 53, 0.35)";
        }}
        >
          {initials}
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "0.25rem", color: "var(--text)" }}>{displayName}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>{user.email}</p>

        <div className="profile-details">
          <div className="profile-details-row">
            <span className="label">Phone</span>
            <span className="val">{user.phone || "Not provided"}</span>
          </div>
          <div className="profile-details-row">
            <span className="label">Role</span>
            <span className="val" style={{ textTransform: "capitalize", color: user.role === "admin" ? "var(--primary)" : "inherit" }}>
              {user.role}
            </span>
          </div>
          <div className="profile-details-row">
            <span className="label">Home Village</span>
            <span className="val">{user.village || "Not specified"}</span>
          </div>
          <div className="profile-details-row">
            <span className="label">Delivery Address</span>
            <span className="val">{user.address || "No address saved"}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "2rem" }}>
          {user.role === "admin" && (
            <button className="primary-btn" style={{ justifyContent: "center" }} onClick={() => navigate("/admin-login")}>
              🛡️ Go to Admin Console
            </button>
          )}
          <button className="primary-btn" style={{ background: "var(--danger)", color: "white", boxShadow: "none", justifyContent: "center" }} onClick={handleLogout}>
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;