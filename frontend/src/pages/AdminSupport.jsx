import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import { joinRoom, useSocketEvent } from "../hooks/useSocket";
import { playNotificationSound } from "../utils/notificationSound";
import API from "../utils/api";

export default function AdminSupport() {
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState("all"); // all, open, inprogress, resolved

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Associated order info state
  const [orderInfo, setOrderInfo] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const chatEndRef = useRef(null);

  // Join admin socket room on mount
  useEffect(() => {
    joinRoom("admin");
    fetchTickets();
  }, []);

  // Fetch associated order when selected ticket changes
  useEffect(() => {
    if (selectedTicket?.orderId) {
      fetchOrderDetails(selectedTicket.orderId);
    } else {
      setOrderInfo(null);
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?._id, selectedTicket?.messages]);

  // Socket: listen for new support tickets
  useSocketEvent("new-ticket", ({ ticket, customerName, category }) => {
    playNotificationSound("bell");
    addNotification(
      "New Ticket Received! 🎫",
      `${customerName} filed a ticket under category: ${category}.`
    );
    // Add ticket to state
    setTickets((prev) => [ticket, ...prev]);
  });

  // Socket: listen for ticket updates/replies
  useSocketEvent("ticket-update", ({ ticketId, ticket, latestMessage, sender }) => {
    // Update ticket in state list
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? ticket : t))
    );

    // If currently viewing this ticket, update active view
    if (selectedTicket?._id === ticketId) {
      setSelectedTicket(ticket);
      // Play sound only if customer replied
      if (sender === "user") {
        playNotificationSound("success");
        addNotification("New Ticket Reply 💬", `Customer replied to ticket #${ticketId.slice(-6)}`);
      }
    }
  });

  // Socket: listen for status changes (if done from elsewhere)
  useSocketEvent("ticket-status-change", ({ ticketId, status }) => {
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status } : t))
    );
    if (selectedTicket?._id === ticketId) {
      setSelectedTicket((prev) => ({ ...prev, status }));
    }
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await API.get("/support");
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching admin support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setLoadingOrder(true);
    try {
      const res = await API.get(`/orders`);
      // Find the specific order from list (since backend handles admin retrieve all)
      const foundOrder = res.data.find((o) => o._id === orderId);
      setOrderInfo(foundOrder || null);
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await API.post(`/support/${selectedTicket._id}/message`, {
        message: replyText,
      });
      setSelectedTicket(res.data.ticket);
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? res.data.ticket : t))
      );
      setReplyText("");
    } catch (err) {
      console.error("Error replying to ticket:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await API.put(`/support/${selectedTicket._id}/status`, {
        status: newStatus,
      });
      setSelectedTicket(res.data.ticket);
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? res.data.ticket : t))
      );
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  // Filters logic
  const filteredTickets = tickets.filter((t) => {
    if (filter === "open") return t.status === "Open";
    if (filter === "inprogress") return t.status === "In Progress";
    if (filter === "resolved") return t.status === "Resolved";
    return true; // all
  });

  return (
    <div className="admin-support-container" style={{ display: "flex", gap: "20px", height: "calc(100vh - 120px)" }}>
      {/* Left Sidebar: Tickets List */}
      <div className="admin-support-sidebar" style={{ width: "380px", background: "rgba(30, 41, 59, 0.95)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Filters */}
        <div style={{ padding: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.5)" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem", color: "white" }}>Support Tickets 🎫</h3>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto" }}>
            {[
              { id: "all", label: "All" },
              { id: "open", label: "Open" },
              { id: "inprogress", label: "In Prog" },
              { id: "resolved", label: "Resolved" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  background: filter === tab.id ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "background 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="admin-ticket-list" style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {loading ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>Loading tickets...</p>
          ) : filteredTickets.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No tickets found.</p>
          ) : (
            filteredTickets.map((t) => {
              const isActive = selectedTicket?._id === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  style={{
                    padding: "12px 15px",
                    background: isActive ? "rgba(255, 107, 53, 0.15)" : "transparent",
                    border: isActive ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "10px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.9rem", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      {t.subject}
                    </h4>
                    <span className={`status-badge ticket-status-${t.status.toLowerCase().replace(/\s/g, "")}`}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <span>{t.name}</span>
                    <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Side: Active Ticket Chat & Details */}
      <div style={{ flex: 1, display: "flex", gap: "20px" }}>
        {selectedTicket ? (
          <>
            {/* Conversation Area */}
            <div style={{ flex: 1, background: "rgba(30, 41, 59, 0.95)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.5)" }}>
                <div>
                  <h3 style={{ margin: 0, color: "white", fontSize: "1.1rem" }}>{selectedTicket.subject}</h3>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Category: <strong>{selectedTicket.category}</strong> • ID: #{selectedTicket._id.slice(-6)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {selectedTicket.status !== "Resolved" ? (
                    <button
                      className="primary-btn"
                      onClick={() => handleUpdateStatus("Resolved")}
                      style={{ padding: "6px 14px", fontSize: "0.75rem", background: "#2ecc71", borderColor: "#2ecc71" }}
                    >
                      ✓ Mark Resolved
                    </button>
                  ) : (
                    <button
                      className="primary-btn"
                      onClick={() => handleUpdateStatus("In Progress")}
                      style={{ padding: "6px 14px", fontSize: "0.75rem", background: "#f1c40f", borderColor: "#f1c40f" }}
                    >
                      🔓 Re-open Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="admin-chat-messages" style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "#0f172a" }}>
                {selectedTicket.messages.map((msg, i) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isAdmin ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isAdmin ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          background: isAdmin ? "var(--primary)" : "#1e293b",
                          color: "white",
                          padding: "10px 14px",
                          borderRadius: isAdmin ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          fontSize: "0.85rem",
                          lineHeight: "1.4",
                        }}
                      >
                        {msg.message}
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "4px" }}>
                        {isAdmin ? "You" : "Customer"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.3)", display: "flex", gap: "10px" }}
              >
                <input
                  type="text"
                  placeholder="Type a response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={submittingReply}
                  style={{
                    flex: 1,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "24px",
                    padding: "10px 16px",
                    color: "white",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="primary-btn"
                  style={{ padding: "8px 20px", fontSize: "0.85rem" }}
                >
                  {submittingReply ? "..." : "Send"}
                </button>
              </form>
            </div>

            {/* Details Panel */}
            <div style={{ width: "320px", background: "rgba(30, 41, 59, 0.95)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", color: "white" }}>
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                  Customer Details 👤
                </h3>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem" }}>
                  <strong>Name:</strong> {selectedTicket.name}
                </p>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem" }}>
                  <strong>Email:</strong> {selectedTicket.email}
                </p>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem" }}>
                  <strong>Phone:</strong> {selectedTicket.phone}
                </p>
              </div>

              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                  Associated Order 🔗
                </h3>
                {selectedTicket.orderId ? (
                  loadingOrder ? (
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Loading order info...</p>
                  ) : orderInfo ? (
                    <div style={{ background: "rgba(15, 23, 42, 0.3)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.8rem" }}>
                        <strong>Order:</strong> #{orderInfo._id.slice(-6)}
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.8rem" }}>
                        <strong>Date:</strong> {new Date(orderInfo.createdAt).toLocaleString()}
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.8rem" }}>
                        <strong>Total:</strong> ₹{orderInfo.totalAmount} ({orderInfo.paymentMethod})
                      </p>
                      <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem" }}>
                        <strong>Status:</strong>{" "}
                        <span className={`status-badge badge-${orderInfo.status.toLowerCase().replace(/\s/g, "")}`}>
                          {orderInfo.status}
                        </span>
                      </p>
                      <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "6px", fontSize: "0.75rem", color: "#94a3b8" }}>
                        <strong>Items:</strong>
                        <ul style={{ paddingLeft: "15px", margin: "4px 0" }}>
                          {orderInfo.items?.map((item, idx) => (
                            <li key={idx}>
                              {item.name} ×{item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Order #{selectedTicket.orderId.slice(-6)} details not found.</p>
                  )
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No order associated with this ticket.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, background: "rgba(30, 41, 59, 0.95)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <h3>Select a ticket from the left sidebar to start processing.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
