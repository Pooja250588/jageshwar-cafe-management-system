import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api";
import OtpInput from "../components/OtpInput";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Validation feedback
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [checkingPhone, setCheckingPhone] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [isMockMode, setIsMockMode] = useState(false);

  const emailTimeoutRef = useRef(null);
  const phoneTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (showOtpModal && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpTimer]);

  // ── Email Validation ──
  const validateEmail = async (val) => {
    if (!val) { setEmailError(""); setEmailSuccess(""); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError("Enter a valid email like name@email.com");
      setEmailSuccess("");
      return;
    }
    setEmailError("");
    setCheckingEmail(true);
    try {
      const res = await API.post("/auth/check-email", { email: val });
      if (res.data.available) {
        setEmailSuccess("Email is available ✅");
        setEmailError("");
      } else {
        setEmailError("This email is already registered ❌");
        setEmailSuccess("");
      }
    } catch {
      // If backend is down, allow the user to proceed – the server will catch duplicates on submit
      setEmailSuccess("");
      setEmailError("");
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError(""); setEmailSuccess("");
    if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    emailTimeoutRef.current = setTimeout(() => validateEmail(val), 700);
  };

  // ── Phone Validation ──
  const validatePhone = async (val) => {
    if (!val) { setPhoneError(""); setPhoneSuccess(""); return; }
    if (!/^[6-9]\d{9}$/.test(val)) {
      setPhoneError("Enter a valid 10-digit number starting with 6-9");
      setPhoneSuccess("");
      return;
    }
    setPhoneError("");
    setCheckingPhone(true);
    try {
      const res = await API.post("/auth/check-phone", { phone: val });
      if (res.data.available) {
        setPhoneSuccess("Phone number is available ✅");
        setPhoneError("");
      } else {
        setPhoneError("This phone is already registered ❌");
        setPhoneSuccess("");
      }
    } catch {
      setPhoneSuccess("");
      setPhoneError("");
    } finally {
      setCheckingPhone(false);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    setPhoneError(""); setPhoneSuccess("");
    if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);
    phoneTimeoutRef.current = setTimeout(() => validatePhone(val), 700);
  };

  // ── Password Strength ──
  const checkPasswordStrength = (val) => {
    if (!val) { setPasswordStrength({ score: 0, label: "", color: "" }); setPasswordFeedback(""); return; }
    let score = 0, feedback = [];
    if (val.length >= 6) score++; else feedback.push("Min 6 characters");
    if (/[A-Za-z]/.test(val) && /\d/.test(val)) score++; else feedback.push("Mix letters & numbers");
    if (/[^A-Za-z0-9]/.test(val)) score++; else feedback.push("Add symbols (@, $, !)");
    if (val.length >= 8) score++;
    let label = "Weak 🔴", color = "#ef4444";
    if (score >= 3) { label = "Strong 💪"; color = "#22c55e"; }
    else if (score >= 2) { label = "Medium ⚠️"; color = "#eab308"; }
    setPasswordStrength({ score, label, color });
    setPasswordFeedback(feedback.join(" • "));
  };

  // ── Form Submit → OTP Modal ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) { setFormError("Please enter your full name."); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setFormError("Please enter a valid email address."); return; }
    if (emailError) { setFormError(emailError); return; }

    if (!/^[6-9]\d{9}$/.test(phone)) { setFormError("Please enter a valid 10-digit phone number."); return; }
    if (phoneError) { setFormError(phoneError); return; }

    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const res = await API.post("/auth/register-otp", { phone });
      setGeneratedOtp(res.data.otp || "");
      setIsMockMode(res.data.mockMode || false);
      setUserOtpInput("");
      setOtpError("");
      setOtpTimer(60);
      setShowOtpModal(true);
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to send OTP code. Please check that backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP → Register ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (userOtpInput.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      await API.post("/auth/register", { 
        name, 
        email, 
        phone, 
        password, 
        role: "user", 
        village, 
        address,
        otp: userOtpInput 
      });
      setShowOtpModal(false);
      alert("🎉 Account Created Successfully! Please login now.");
      navigate("/login");
    } catch (error) {
      setOtpError(error.response?.data?.message || "Registration failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/register-otp", { phone });
      setGeneratedOtp(res.data.otp || "");
      setIsMockMode(res.data.mockMode || false);
      setOtpTimer(60);
      setUserOtpInput("");
    } catch (error) {
      setOtpError(error.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <style>{`
        .otp-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:2000; padding:1rem; }
        .otp-modal-card { background:#1e293b; border:1px solid rgba(255,255,255,0.1); padding:2.5rem 2rem; border-radius:16px; width:100%; max-width:440px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); text-align:center; color:white; }
        .otp-test-banner { background:rgba(245,158,11,0.1); border:1px dashed #f59e0b; color:#f59e0b; padding:0.75rem; border-radius:8px; font-size:0.9rem; margin-bottom:1.5rem; font-weight:500; }
        .input-highlight-success { border-color:#22c55e !important; box-shadow:0 0 0 2px rgba(34,197,94,0.2) !important; }
        .input-highlight-error { border-color:#ef4444 !important; box-shadow:0 0 0 2px rgba(239,68,68,0.2) !important; }
        .form-error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:0.75rem 1rem; border-radius:8px; margin-bottom:1.5rem; font-size:0.9rem; text-align:center; }
      `}</style>

      <div className="form-card" style={{ maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem", display: "block", border: "2px solid var(--primary)" }} />
          <h1>Create Your Account</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Join Jageshwar Cafe & order food online!</p>
        </div>

        {formError && <div className="form-error-banner">⚠️ {formError}</div>}

        <form onSubmit={handleRegisterSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input type="text" id="name" className="form-control" placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input type="email" id="reg-email" className={`form-control ${emailError ? "input-highlight-error" : emailSuccess ? "input-highlight-success" : ""}`} placeholder="name@email.com" value={email} onChange={handleEmailChange} required />
            {checkingEmail && <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>Checking... ⏳</small>}
            {emailError && <small style={{ color: "#ef4444", display: "block", marginTop: "4px" }}>{emailError}</small>}
            {emailSuccess && <small style={{ color: "#22c55e", display: "block", marginTop: "4px" }}>{emailSuccess}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Phone Number *</label>
            <input type="tel" id="reg-phone" className={`form-control ${phoneError ? "input-highlight-error" : phoneSuccess ? "input-highlight-success" : ""}`} placeholder="10-digit mobile number" value={phone} onChange={handlePhoneChange} required />
            {checkingPhone && <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>Checking... ⏳</small>}
            {phoneError && <small style={{ color: "#ef4444", display: "block", marginTop: "4px" }}>{phoneError}</small>}
            {phoneSuccess && <small style={{ color: "#22c55e", display: "block", marginTop: "4px" }}>{phoneSuccess}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="village">Your Village *</label>
            <input 
              type="text" 
              id="village" 
              className="form-control" 
              placeholder="Enter your village name"
              value={village} 
              onChange={(e) => setVillage(e.target.value)}
              required
            />
            <small style={{ color: "var(--text-muted)", display: "block", marginTop: "5px", fontSize: "0.75rem" }}>📍 Enter the village where you want your orders delivered.</small>
          </div>

          <div className="form-group">
            <label htmlFor="reg-address">Delivery Address</label>
            <textarea id="reg-address" className="form-control form-control-textarea" placeholder="House number, landmark, street..." value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password *</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} id="reg-password" className="form-control" placeholder="Min 6 characters" value={password} onChange={(e) => { setPassword(e.target.value); checkPasswordStrength(e.target.value); }} required style={{ paddingRight: "45px" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#94a3b8" }}>{showPassword ? "👁️" : "🙈"}</button>
            </div>
            {password && (
              <div style={{ marginTop: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                  <span style={{ color: "#94a3b8" }}>Strength: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong></span>
                  {passwordFeedback && <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>({passwordFeedback})</span>}
                </div>
                <div style={{ height: "5px", width: "100%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(passwordStrength.score / 4) * 100}%`, backgroundColor: passwordStrength.color, transition: "width 0.3s ease" }} />
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Registering..." : "🚀 Create Account"}
            </button>
          </div>
        </form>

        <div className="form-redirect">Already have an account? <Link to="/login">Login here</Link></div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📱 Verify Your Account</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Enter the 6-digit code sent to +91 {phone} to complete registration.</p>

            {/* Real SMS Mode */}
            {!isMockMode && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.5rem", fontWeight: "500" }}>
                ✅ OTP sent to your phone <strong>+91 {phone}</strong> via SMS
              </div>
            )}

            {/* Development/Sandbox Mode */}
            {isMockMode && generatedOtp && (
              <div className="otp-test-banner" style={{ background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", color: "#eab308", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                ⚡ <strong>Dev Mode:</strong> Your OTP Code is <strong style={{ fontSize: "1rem", letterSpacing: "1px" }}>{generatedOtp}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <OtpInput length={6} onChange={(val) => { setUserOtpInput(val); setOtpError(""); }} />
                {otpError && <small style={{ color: "#ef4444", display: "block", marginTop: "8px", fontWeight: "500", textAlign: "center" }}>⚠️ {otpError}</small>}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="primary-btn" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  {loading ? "Verifying..." : "Confirm & Register"}
                </button>
                <button type="button" className="secondary-btn" onClick={() => setShowOtpModal(false)} style={{ color: "#94a3b8", borderColor: "#475569" }} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>

            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "1rem" }}>
              {otpTimer > 0 ? (
                <span>Resend in <strong>{otpTimer}s</strong></span>
              ) : (
                <button type="button" onClick={handleResendOtp} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }} disabled={loading}>Get New Code</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;