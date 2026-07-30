import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [foodsCount, setFoodsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get("/orders"), API.get("/foods")])
      .then(([ordersRes, foodsRes]) => {
        setOrders(ordersRes.data);
        setFoodsCount(foodsRes.data.length);
      })
      .catch((err) => {
        console.error("Dashboard data load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Rejected"
  ).length;

  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;

  const totalRevenue = orders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const onlineRevenue = orders
    .filter((o) => o.status === "Delivered" && o.paymentMethod === "Online")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const codRevenue = orders
    .filter((o) => o.status === "Delivered" && o.paymentMethod !== "Online")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getSalesHistory = () => {
    const history = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      history[dateString] = 0;
    }

    orders.forEach((o) => {
      if (o.status === "Delivered") {
        const orderDate = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (history[orderDate] !== undefined) {
          history[orderDate] += o.totalAmount;
        }
      }
    });

    return Object.entries(history).map(([date, amount]) => ({ date, amount }));
  };

  const salesData = getSalesHistory();
  const maxSales = Math.max(...salesData.map((d) => d.amount), 1);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card-modern">
          <div className="dashboard-card-icon icon-green">💰</div>
          <div className="dashboard-card-info">
            <h2>₹{totalRevenue.toLocaleString()}</h2>
            <p>Total Revenue</p>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
              💳 Online: ₹{onlineRevenue.toLocaleString()} • 💵 COD: ₹{codRevenue.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="dashboard-card-modern">
          <div className="dashboard-card-icon icon-blue">📦</div>
          <div className="dashboard-card-info">
            <h2>{totalOrders}</h2>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="dashboard-card-modern">
          <div className="dashboard-card-icon icon-orange">🔥</div>
          <div className="dashboard-card-info">
            <h2>{activeOrders}</h2>
            <p>Active Orders</p>
          </div>
        </div>
        <div className="dashboard-card-modern">
          <div className="dashboard-card-icon icon-purple">🍔</div>
          <div className="dashboard-card-info">
            <h2>{foodsCount}</h2>
            <p>Menu Items</p>
          </div>
        </div>
      </div>

      {/* Revenue History Chart */}
      <div className="dash-panel" style={{ marginBottom: "2rem" }}>
        <div className="dash-panel-header">
          <h3>Revenue History (Last 7 Days)</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>Delivered order earnings</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "180px", padding: "20px 0 10px 0", gap: "12px", marginTop: "1rem" }}>
          {salesData.map((d, index) => {
            const pct = (d.amount / maxSales) * 100;
            return (
              <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold", marginBottom: "6px", color: "#ff6b35" }}>
                  ₹{d.amount}
                </span>
                <div style={{
                  width: "100%",
                  maxWidth: "45px",
                  height: `${Math.max(pct, 4)}%`,
                  background: "linear-gradient(180deg, #ff6b35 0%, rgba(255, 107, 53, 0.25) 100%)",
                  borderRadius: "6px 6px 0 0",
                  transition: "height 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", fontWeight: "bold" }}>
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="dash-bottom-grid">
        {/* Recent Orders */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Recent Orders</h3>
            <button
              className="dash-panel-link"
              onClick={() => navigate("/admin-orders")}
            >
              View All →
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="dash-empty">No orders yet.</p>
          ) : (
            <div className="dash-order-list">
              {orders.slice(0, 6).map((order) => (
                <div key={order._id} className="dash-order-row">
                  <div className="dash-order-info">
                    <h4>{order.customerName}</h4>
                    <span>
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} •
                      ₹{order.totalAmount}
                    </span>
                  </div>
                  <span
                    className={`status-badge badge-${order.status
                      ?.toLowerCase()
                      .replace(/\s/g, "")}`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="dash-actions">
            <button
              className="dash-action-card"
              onClick={() => navigate("/admin-orders")}
            >
              <span>📦</span>
              <div>
                <h4>Process Orders</h4>
                <p>Update delivery statuses</p>
              </div>
            </button>
            <button
              className="dash-action-card"
              onClick={() => navigate("/admin")}
            >
              <span>➕</span>
              <div>
                <h4>Add Menu Item</h4>
                <p>Add or edit food items</p>
              </div>
            </button>
            <button
              className="dash-action-card"
              onClick={() => window.open("/", "_blank")}
            >
              <span>🌐</span>
              <div>
                <h4>View Customer Site</h4>
                <p>See live customer experience</p>
              </div>
            </button>
          </div>

          {/* Summary */}
          <div className="dash-summary">
            <div className="dash-summary-row">
              <span>Delivered Today</span>
              <strong style={{ color: "var(--success)" }}>{deliveredOrders}</strong>
            </div>
            <div className="dash-summary-row">
              <span>Pending / Active</span>
              <strong style={{ color: "var(--warning)" }}>{activeOrders}</strong>
            </div>
            <div className="dash-summary-row">
              <span>Total Menu Items</span>
              <strong>{foodsCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;