import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";

function Navbar() {
  const { cart } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const { notifications, markAllAsRead, clearAllNotifications } = useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user?.name);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Total items count in cart
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="glass-nav">
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ height: "45px", width: "45px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
        <div>
          <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Jageshwar Cafe & restaurant</h2>
        
        </div>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/cart" className="cart-link">
          🛒 Cart <span className="cart-badge">{cartCount}</span>
        </Link>
        <Link to="/support">Support</Link>

        {/* Bell Notification */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown) markAllAsRead();
            }}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              padding: "4px 8px"
            }}
          >
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  lineHeight: 1
                }}
              >
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: "320px",
                background: "rgba(30, 41, 59, 0.98)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                zIndex: 1000,
                marginTop: "10px",
                color: "white",
                animation: "fadeIn 0.2s ease"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "bold" }}>Notifications</h4>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div
                style={{
                  maxHeight: "280px",
                  overflowY: "auto",
                  padding: "8px 0"
                }}
              >
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                    No notifications yet 📭
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        fontSize: "0.85rem",
                        textAlign: "left",
                        background: notif.read ? "transparent" : "rgba(245, 158, 11, 0.05)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "8px" }}>
                        <span style={{ fontWeight: "700", color: notif.read ? "white" : "var(--accent)" }}>{notif.title}</span>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", flexShrink: 0 }}>{notif.time}</span>
                      </div>
                      <p style={{ margin: 0, color: "#94a3b8", lineHeight: "1.3" }}>{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user ? (
          <>
            <Link to="/orders">My Orders</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/settings">Settings</Link>
            {user.role === "admin" && (
              <Link to="/admin-login" style={{ color: "var(--accent)", fontWeight: "bold" }}>
                🛡️ Admin Panel
              </Link>
            )}
            <Link to="/profile" className="profile-link" style={{ display: "flex", alignItems: "center", textDecoration: "none" }} title="My Profile">
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff6b35 0%, #ff9f43 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: "800",
                boxShadow: "0 2px 6px rgba(255, 107, 53, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "transform 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {initials}
              </div>
            </Link>
            <button className="logout-btn-nav" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-nav-btn">Login</Link>
            <Link to="/register" className="register-nav-btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;