import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import { joinRoom, useSocketEvent } from "../hooks/useSocket";
import { playNotificationSound, speakText, getAudioContext, unlockAudio } from "../utils/notificationSound";
import API from "../utils/api";

function AdminLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

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

  const initials = getInitials(user?.name);
  const displayName = getDisplayName(user?.name);

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [newTicketFlash, setNewTicketFlash] = useState(false);
  const [audioState, setAudioState] = useState("suspended");

  // Track AudioContext state
  useEffect(() => {
    try {
      const ctx = getAudioContext();
      setAudioState(ctx.state);
      const updateState = () => setAudioState(ctx.state);
      ctx.addEventListener("statechange", updateState);
      return () => ctx.removeEventListener("statechange", updateState);
    } catch (e) {
      console.warn("AudioContext tracking not supported:", e);
    }
  }, []);

  const handleUnlockAudio = async () => {
    const success = await unlockAudio();
    if (success) {
      playNotificationSound("success");
    }
  };

  // Join admin socket room when layout mounts
  useEffect(() => {
    if (user?.role === "admin") {
      joinRoom("admin");
      
      // Fetch initial open/pending tickets count
      API.get("/support")
        .then((res) => {
          const openTickets = res.data.filter((t) => t.status === "Open" || t.status === "In Progress").length;
          setPendingTicketsCount(openTickets);
        })
        .catch((err) => console.error("Error loading initial tickets:", err));
    }
  }, [user]);

  // Listen for real-time new-order events
  useSocketEvent("new-order", (data) => {
    const { customerName, totalAmount, itemCount } = data;

    // Play bell sound
    playNotificationSound("bell");

    // Voice announcement
    speakText(
      `New order received! ${customerName} placed an order of ${totalAmount} rupees. ${itemCount} item${itemCount !== 1 ? "s" : ""}.`
    );

    // Show notification
    addNotification(
      "New Order Received! 🍕",
      `${customerName} placed an order for ₹${totalAmount} (${itemCount} item${itemCount !== 1 ? "s" : ""}).`
    );

    // Flash animation on sidebar nav item
    setPendingCount((c) => c + 1);
    setNewOrderFlash(true);
    setTimeout(() => setNewOrderFlash(false), 3000);
  });

  // Listen for real-time new-ticket events
  useSocketEvent("new-ticket", (data) => {
    const { customerName, category, subject } = data;

    // Play bell sound
    playNotificationSound("bell");

    // Voice announcement
    speakText(
      `New support ticket received from ${customerName} for ${category}.`
    );

    // Show notification
    addNotification(
      "New Support Ticket! 🎫",
      `${customerName} filed a ticket: "${subject.slice(0, 30)}..."`
    );

    // Flash animation on sidebar support nav item
    setPendingTicketsCount((c) => c + 1);
    setNewTicketFlash(true);
    setTimeout(() => setNewTicketFlash(false), 3000);
  });

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  const navItems = [
    { path: "/admin-dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin-orders", icon: "📦", label: "Manage Orders", badge: pendingCount },
    { path: "/admin", icon: "🍔", label: "Manage Menu" },
    { path: "/admin-support", icon: "🎫", label: "Support Tickets", badge: pendingTicketsCount, flash: newTicketFlash },
    { path: "/admin-settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="admin-shell">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ height: "36px", width: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }} />
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Jageshwar Cafe</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Admin Console</span>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? "active" : ""} ${item.badge && (item.flash || newOrderFlash) ? "nav-item-flash" : ""}`}
              onClick={() => {
                if (item.path === "/admin-orders") setPendingCount(0);
                if (item.path === "/admin-support") setPendingTicketsCount(0);
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{initials}</div>
            <div>
              <p className="admin-name">{displayName}</p>
              <p className="admin-role">Administrator</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-info">
            <h3>Welcome back, {displayName} 👋</h3>
            <p>Jageshwar Cafe & Restaurant — Admin Panel</p>
          </div>
          <div className="admin-topbar-actions" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {audioState !== "running" ? (
              <button 
                onClick={handleUnlockAudio} 
                className="view-site-btn" 
                style={{ background: "#ff9f43", color: "#fff", fontWeight: "bold", border: "none" }}
              >
                🔔 Enable Sound Alert
              </button>
            ) : (
              <span style={{ fontSize: "0.85rem", color: "#2ecc71", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                🔊 Alerts Active
              </span>
            )}
            <Link to="/" target="_blank" className="view-site-btn">
              🌐 View Customer Site
            </Link>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
