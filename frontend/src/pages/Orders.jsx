import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { NotificationContext } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";
import { joinRoom, useSocketEvent } from "../hooks/useSocket";
import { playNotificationSound } from "../utils/notificationSound";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);

  const fetchOrders = () => {
    API.get("/orders")
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    // Join user's socket room for real-time updates
    if (user?._id) joinRoom("user", user._id);
    // No more polling — Socket.IO handles real-time updates
  }, [user]);

  // Real-time: listen for order status updates from admin or cancellation
  useSocketEvent("order-status-update", ({ orderId, status, paymentStatus }) => {
    const statusEmoji = {
      accepted: "✅",
      preparing: "👨‍🍳",
      ready: "🔔",
      delivery: "🛵",
      outfordelivery: "🛵",
      delivered: "🏠",
      rejected: "❌",
      cancelled: "❌"
    };
    const emoji = statusEmoji[status.toLowerCase().replace(/\s/g, "")] || "📦";
    const displayStatus = status === "Accepted" ? "Getting Ready" : status;

    // Play chime
    playNotificationSound("success");

    // Show notification
    addNotification(
      `Order Update ${emoji}`,
      `Your order #${orderId?.slice(-6)} is now: ${displayStatus}.`
    );

    // Update the order in state immediately
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status, paymentStatus: paymentStatus || o.paymentStatus } : o))
    );
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      API.put(`/orders/${orderId}/cancel`)
        .then((res) => {
          playNotificationSound("success");
          addNotification("Order Cancelled ✕", "Your order has been cancelled successfully.");
          setOrders((prev) =>
            prev.map((o) =>
              o._id === orderId
                ? { ...o, status: "Cancelled", paymentStatus: res.data.order.paymentStatus }
                : o
            )
          );
        })
        .catch((err) => {
          console.error("Failed to cancel order:", err);
          alert(err.response?.data?.message || "Failed to cancel order.");
        });
    }
  };

  const steps = ["Pending", "Getting Ready", "Preparing", "Ready", "Delivery", "Delivered"];

  const getStepIndex = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return 0;
    if (s === "accepted" || s === "getting ready") return 1;
    if (s === "preparing") return 2;
    if (s === "ready") return 3;
    if (s === "out for delivery" || s === "delivery") return 4;
    if (s === "delivered") return 5;
    return -1; // e.g., Rejected, Cancelled
  };

  const getBadgeClass = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "badge-pending";
    if (s === "accepted") return "badge-accepted";
    if (s === "preparing") return "badge-preparing";
    if (s === "ready") return "badge-ready";
    if (s === "out for delivery" || s === "delivery") return "badge-delivery";
    if (s === "delivered") return "badge-delivered";
    return "badge-rejected"; // Also applies to cancelled
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center" }}>
        <h2>Loading orders...</h2>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h1>My Orders 📦</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "24px", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "4rem" }}>🍔</span>
          <h2 style={{ marginTop: "1.5rem" }}>No orders placed yet</h2>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            You haven't ordered anything yet. Head over to our Menu page to try something fresh!
          </p>
        </div>
      ) : (
        orders.map((order) => {
          const currentStep = getStepIndex(order.status);
          const isRejected = order.status?.toLowerCase() === "rejected" || order.status?.toLowerCase() === "cancelled";

          return (
            <div key={order._id} className="order-history-card">
              <div className="order-header-details">
                <div className="order-id-date">
                  <h3>Order #{order._id?.slice(-6)}</h3>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => navigate(`/support?orderId=${order._id}`)}
                    style={{
                      background: "rgba(255, 107, 53, 0.1)",
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={e => {
                      e.target.style.background = "var(--primary)";
                      e.target.style.color = "white";
                    }}
                    onMouseOut={e => {
                      e.target.style.background = "rgba(255, 107, 53, 0.1)";
                      e.target.style.color = "var(--primary)";
                    }}
                  >
                    💬 Need Help?
                  </button>
                  {order.status === "Pending" ? (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      style={{
                        background: "rgba(231, 76, 60, 0.1)",
                        border: "1px solid var(--danger)",
                        color: "var(--danger)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "var(--transition)"
                      }}
                      onMouseOver={e => {
                        e.target.style.background = "var(--danger)";
                        e.target.style.color = "white";
                      }}
                      onMouseOut={e => {
                        e.target.style.background = "rgba(231, 76, 60, 0.1)";
                        e.target.style.color = "var(--danger)";
                      }}
                    >
                      ✕ Cancel Order
                    </button>
                  ) : order.status === "Accepted" ? (
                    <span style={{
                      background: "rgba(243, 156, 18, 0.1)",
                      border: "1px solid #f39c12",
                      color: "#f39c12",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      🍳 Getting Ready
                    </span>
                  ) : null}
                  <span className={`status-badge ${getBadgeClass(order.status)}`}>
                    {order.status === "Accepted" ? "Getting Ready" : order.status}
                  </span>
                </div>
              </div>

              <div style={{ margin: "1rem 0" }}>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Items</h4>
                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {order.items?.map((item, index) => (
                    <li key={index} style={{ padding: "4px 0", borderBottom: "1px dashed var(--border)" }}>
                      {item.name}
                      {item.selectedSize && (
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", marginLeft: "6px", fontWeight: "bold" }}>
                          ({item.selectedSize})
                        </span>
                      )}
                      {" "}
                      <span style={{ color: "var(--text-muted)" }}>× {item.quantity}</span>
                      <span style={{ float: "right", fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", margin: "1.5rem 0 1rem", fontWeight: 800, fontSize: "1.15rem", alignItems: "center" }}>
                <span>Total Amount {order.paymentStatus === "Paid" ? "Paid" : "Due"}</span>
                <span style={{ color: "var(--primary)" }}>₹{order.totalAmount}</span>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 15px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "1.5rem", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  📍 <strong>Delivery:</strong> {order.customerName} • {order.phone} • {order.address}
                </div>
                <div>
                  💳 <strong>Payment:</strong> {order.paymentMethod || "COD"} (
                  <span style={{ 
                    color: order.paymentStatus === "Paid" ? "#2ecc71" : "#f1c40f",
                    fontWeight: "bold"
                  }}>
                    {order.paymentStatus || "Pending"}
                  </span>
                  )
                </div>
              </div>

              {/* Status Tracking Stepper */}
              {!isRejected ? (
                <>
                  <div className="stepper-wrapper">
                    {steps.map((step, idx) => {
                      let stepState = "";
                      if (order.status?.toLowerCase() === "delivered") {
                        stepState = "completed";
                      } else if (idx < currentStep) {
                        stepState = "completed";
                      } else if (idx === currentStep) {
                        stepState = "active";
                      }

                      return (
                        <div key={step} className={`stepper-step ${stepState}`}>
                          <div className="stepper-circle">
                            {stepState === "completed" ? "✓" : idx + 1}
                          </div>
                          <div className="stepper-label">{step}</div>
                        </div>
                      );
                    })}
                  </div>

                  {order.status?.toLowerCase() === "delivered" && (
                    <div style={{
                      marginTop: "1.5rem",
                      padding: "1rem 1.25rem",
                      background: "rgba(46, 204, 113, 0.15)",
                      border: "1px solid #2ecc71",
                      borderRadius: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <div>
                        <h4 style={{ margin: 0, color: "#2ecc71", fontSize: "0.95rem", fontWeight: "bold" }}>🎉 Order Delivered!</h4>
                        <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          How was your food experience? Share your feedback with us!
                        </p>
                      </div>
                      <button
                        className="primary-btn"
                        style={{ padding: "8px 16px", fontSize: "0.85rem", background: "#2ecc71", borderColor: "#2ecc71" }}
                        onClick={() => navigate("/reviews")}
                      >
                        ✍ Write a Review
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "1.25rem", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "12px", textAlign: "center", fontWeight: 700, display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                  <span>
                    {order.status?.toLowerCase() === "cancelled"
                      ? "✕ You cancelled this order."
                      : "✕ This order was cancelled or rejected by the restaurant."}
                  </span>
                  <button 
                    className="primary-btn" 
                    style={{ background: "var(--danger)", borderColor: "var(--danger)", padding: "6px 16px", fontSize: "0.8rem" }}
                    onClick={() => navigate(`/support?orderId=${order._id}`)}
                  >
                    💬 Contact Support
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Orders;