import { useEffect, useState } from "react";
import { useSocketEvent } from "../hooks/useSocket";
import API from "../utils/api";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  const fetchOrders = () => {
    API.get("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to load admin orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // No more polling — Socket.IO handles real-time updates
  }, []);

  // Real-time: instantly prepend new orders from Socket.IO
  useSocketEvent("new-order", (data) => {
    const { order } = data;

    setOrders((prev) => [order, ...prev]);
    setNewOrderIds((prev) => new Set([...prev, order._id]));

    setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
    }, 4000);
  });

  // Real-time: listen for order status/payment changes from customer or other tabs
  useSocketEvent("order-status-update", ({ orderId, status, paymentStatus }) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? { ...order, status, paymentStatus: paymentStatus || order.paymentStatus }
          : order
      )
    );
  });

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}`, { status });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? { ...order, status } : order
        )
      );
    } catch {
      alert("Failed to update status.");
    }
  };

  const getBadgeClass = (status) => {
    const s = status?.toLowerCase().replace(/\s/g, "");
    const map = {
      pending: "badge-pending",
      accepted: "badge-accepted",
      preparing: "badge-preparing",
      ready: "badge-ready",
      outfordelivery: "badge-delivery",
      delivery: "badge-delivery",
      delivered: "badge-delivered",
      rejected: "badge-rejected",
      cancelled: "badge-rejected",
    };
    return map[s] || "badge-pending";
  };

  const filterTabs = ["All", "Active", "Pending", "Accepted", "Preparing", "Ready", "Delivered", "Rejected", "Cancelled"];

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "All") return true;
    if (filterStatus === "Active")
      return order.status !== "Delivered" && order.status !== "Rejected" && order.status !== "Cancelled";
    return order.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <div className="dash-page-header">
        <h2>Manage Customer Orders</h2>
        <p>
          {orders.length} total order{orders.length !== 1 ? "s" : ""} •{" "}
          {orders.filter((o) => o.status !== "Delivered" && o.status !== "Rejected").length} active
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="category-tabs" style={{ marginBottom: "2rem" }}>
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`category-tab ${filterStatus === tab ? "active" : ""}`}
            onClick={() => setFilterStatus(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="dash-empty-state">
          <span>📭</span>
          <h3>No orders match this filter</h3>
        </div>
      ) : (
        <div className="admin-orders-board">
          {filteredOrders.map((order) => (
            <div key={order._id} className={`admin-order-card ${newOrderIds.has(order._id) ? "order-card-new" : ""}`}>
              {/* Customer Info */}
              <div className="admin-order-col">
                <h4>Customer</h4>
                <p className="aoc-name">{order.customerName}</p>
                <p className="aoc-detail">📞 {order.phone}</p>
                <p className="aoc-detail">📍 {order.address}</p>
                <p className="aoc-id">#{order._id?.slice(-6)}</p>
                <p className="aoc-date">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <div style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "8px" }}>
                  <p className="aoc-detail" style={{ margin: "2px 0" }}>
                    💳 Method: <strong>{order.paymentMethod || "COD"}</strong>
                  </p>
                  <p className="aoc-detail" style={{ margin: "2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    Status: 
                    <span style={{ 
                      padding: "2px 6px", 
                      borderRadius: "4px", 
                      fontSize: "0.7rem", 
                      fontWeight: "bold",
                      background: order.paymentStatus === "Paid" ? "rgba(46, 204, 113, 0.2)" : "rgba(243, 156, 18, 0.2)",
                      color: order.paymentStatus === "Paid" ? "#2ecc71" : "#f39c12",
                      border: order.paymentStatus === "Paid" ? "1px solid #2ecc71" : "1px solid #f39c12"
                    }}>
                      {order.paymentStatus || "Pending"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="admin-order-col">
                <h4>Items Ordered</h4>
                <ul className="admin-order-items-list">
                  {order.items?.map((item, i) => (
                    <li key={i}>
                      {item.name}{" "}
                      {item.selectedSize && (
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "bold", marginRight: "4px" }}>
                          ({item.selectedSize})
                        </span>
                      )}
                      <strong style={{ color: "var(--primary)" }}>
                        × {item.quantity}
                      </strong>
                    </li>
                  ))}
                </ul>
                <div className="aoc-total">
                  <span>Total</span>
                  <strong>₹{order.totalAmount}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-order-col admin-order-actions">
                <h4>
                  Status:{" "}
                  <span className={`status-badge ${getBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </h4>
                {order.status?.toLowerCase() === "cancelled" ? (
                  <p style={{ color: "var(--danger)", fontWeight: "bold", marginTop: "10px" }}>
                    ✕ Cancelled by Customer
                  </p>
                ) : order.status?.toLowerCase() === "rejected" ? (
                  <p style={{ color: "var(--danger)", fontWeight: "bold", marginTop: "10px" }}>
                    ✕ Order Rejected
                  </p>
                ) : (
                  <>
                    <p className="aoc-detail" style={{ marginBottom: "10px" }}>
                      Update order status:
                    </p>
                    <div className="admin-action-btn-grid">
                      <button
                        className="btn-accept"
                        onClick={() => updateStatus(order._id, "Accepted")}
                      >
                        ✅ Accept
                      </button>
                      <button
                        className="btn-prepare"
                        onClick={() => updateStatus(order._id, "Preparing")}
                      >
                        👨‍🍳 Prepare
                      </button>
                      <button
                        className="btn-ready"
                        onClick={() => updateStatus(order._id, "Ready")}
                      >
                        🔔 Ready
                      </button>
                      <button
                        className="btn-delivery"
                        onClick={() => updateStatus(order._id, "Out For Delivery")}
                      >
                        🛵 Dispatch
                      </button>
                      <button
                        className="btn-delivered"
                        onClick={() => updateStatus(order._id, "Delivered")}
                      >
                        🏠 Delivered
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => updateStatus(order._id, "Rejected")}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;