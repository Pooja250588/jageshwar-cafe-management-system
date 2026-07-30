import { useContext, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import API from "../utils/api";
import OtpInput from "../components/OtpInput";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [loginMethod, setLoginMethod] = useState("password");

  // Password login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // OTP login
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [isMockMode, setIsMockMode] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  // ── Password Login ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!email || !password) {
      setLoginError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await API.post("/auth/login", { email, password });
      const { user, token } = response.data;
      login(user, token);
      addNotification("Welcome back! 👋", `Logged in successfully as ${user.name}.`);
      if (user.role === "admin") navigate("/admin-dashboard");
      else navigate("/profile");
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed. Make sure the backend server is running on port 5000.";
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError("");
    setOtpError("");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian phone number (starting with 6-9).");
      return;
    }
    setLoading(true);
    try {
      const response = await API.post("/auth/login-otp", { phone });
      setGeneratedOtp(response.data.otp || "");
      setIsMockMode(response.data.mockMode || false);
      setOtpSent(true);
      setOtpTimer(60);
      setUserOtpInput("");
      addNotification("OTP Sent 📱", "Enter the verification code sent to your phone number.");
    } catch (error) {
      setPhoneError(error.response?.data?.message || "Failed to send OTP. Make sure your number is registered.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (userOtpInput.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      const response = await API.post("/auth/login-otp-verify", { phone, otp: userOtpInput });
      const { user, token } = response.data;
      login(user, token);
      addNotification("Login Successful! 🎉", `Welcome back, ${user.name}.`);
      if (user.role === "admin") navigate("/admin-dashboard");
      else navigate("/profile");
    } catch (error) {
      setOtpError(error.response?.data?.message || "Login failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setLoading(true);
    try {
      const response = await API.post("/auth/login-otp", { phone });
      setGeneratedOtp(response.data.otp || "");
      setIsMockMode(response.data.mockMode || false);
      setOtpTimer(60);
      setUserOtpInput("");
    } catch {
      setOtpError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <style>{`
        .form-error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:0.75rem 1rem; border-radius:8px; margin-bottom:1.5rem; font-size:0.9rem; text-align:center; }
        .input-highlight-error { border-color:#ef4444 !important; box-shadow:0 0 0 2px rgba(239,68,68,0.2) !important; }
      `}</style>

      <div className="form-card" style={{ maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ width: "75px", height: "75px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem", display: "block", border: "2px solid var(--primary)" }} />
          <h1 style={{ fontSize: "1.8rem" }}>Login to Jageshwar Cafe</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>Experience fresh & delicious food</p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "8px", marginBottom: "2rem", border: "1px solid var(--border)" }}>
          <button type="button" onClick={() => { setLoginMethod("password"); setOtpSent(false); setPhoneError(""); setLoginError(""); }} style={{ flex: 1, padding: "10px", background: loginMethod === "password" ? "var(--primary)" : "none", color: loginMethod === "password" ? "white" : "var(--text-muted)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s ease" }}>
            Password Login
          </button>
          <button type="button" onClick={() => { setLoginMethod("otp"); setOtpSent(false); setPhoneError(""); setLoginError(""); }} style={{ flex: 1, padding: "10px", background: loginMethod === "otp" ? "var(--primary)" : "none", color: loginMethod === "otp" ? "white" : "var(--text-muted)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s ease" }}>
            OTP Login 📱
          </button>
        </div>

        {/* Password Login */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordLogin}>
            {loginError && <div className="form-error-banner">⚠️ {loginError}</div>}

            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input type="email" id="login-email" className="form-control" placeholder="name@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setLoginError(""); }} required />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input type="password" id="login-password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} required />
            </div>

            <div className="form-actions" style={{ marginTop: "2rem" }}>
              <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        )}

        {/* OTP - Send Phone */}
        {loginMethod === "otp" && !otpSent && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="login-phone">Registered Phone Number</label>
              <input type="tel" id="login-phone" className={`form-control ${phoneError ? "input-highlight-error" : ""}`} placeholder="10-digit mobile number" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }} required />
              {phoneError && <small style={{ color: "#ef4444", display: "block", marginTop: "6px" }}>⚠️ {phoneError}</small>}
            </div>

            <div className="form-actions" style={{ marginTop: "2rem" }}>
              <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                {loading ? "Sending OTP..." : "Send Verification OTP"}
              </button>
            </div>
          </form>
        )}

        {/* OTP - Verification */}
        {loginMethod === "otp" && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Verification code for +91 {phone}</p>
            </div>

            {/* Real SMS Mode */}
            {!isMockMode && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center", fontWeight: "500" }}>
                ✅ OTP sent to your phone <strong>+91 {phone}</strong> via SMS
              </div>
            )}

            {/* Development/Sandbox Mode */}
            {isMockMode && generatedOtp && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", color: "#eab308", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center", fontWeight: "500" }}>
                ⚡ <strong>Dev Mode:</strong> Your OTP Code is <strong style={{ fontSize: "1.1rem", letterSpacing: "1px" }}>{generatedOtp}</strong>
              </div>
            )}

            <div className="form-group">
              <OtpInput length={6} onChange={(val) => { setUserOtpInput(val); setOtpError(""); }} />
              {otpError && <small style={{ color: "#ef4444", display: "block", marginTop: "8px", fontWeight: "500", textAlign: "center" }}>⚠️ {otpError}</small>}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "2rem" }}>
              <button type="submit" className="primary-btn" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button type="button" className="secondary-btn" onClick={() => setOtpSent(false)} style={{ color: "#94a3b8", borderColor: "#475569" }} disabled={loading}>
                Back
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
              {otpTimer > 0 ? (
                <span>Resend OTP in <strong>{otpTimer}s</strong></span>
              ) : (
                <button type="button" onClick={handleResendOtp} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }} disabled={loading}>
                  Resend OTP Code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="form-redirect" style={{ marginTop: "2rem" }}>
          New to Jageshwar Cafe? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;