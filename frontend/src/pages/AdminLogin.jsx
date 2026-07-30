import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";

function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });
      const { user: userData, token } = response.data;

      // Block non-admin users from accessing this panel
      if (userData.role !== "admin") {
        setError("Access Denied: You do not have admin privileges.");
        setLoading(false);
        return;
      }

      login(userData, token);
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Brand */}
        <div className="admin-login-brand" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ height: "70px", width: "70px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", marginBottom: "0.5rem" }} />
          <h1>Jageshwar Cafe</h1>
          <p>Restaurant Admin Console</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="admin-error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              type="email"
              id="admin-email"
              className="form-control"
              placeholder="admin@jageshwarcafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-submit-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "🔐 Login to Admin Panel"}
          </button>
        </form>

        <div className="admin-login-back">
          <a href="/">← Back to Customer Website</a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
