import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { playNotificationSound, speakText } from "../utils/notificationSound";

function AdminSettings() {
  const { user, updateUser } = useContext(AuthContext);
  
  // Tab control
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Sound Test state
  const [soundTestMsg, setSoundTestMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setVillage(user.village || "Jawra");
      setAddress(user.address || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setUpdatingProfile(true);

    try {
      const res = await API.put("/auth/profile", { name, phone, village, address });
      updateUser(res.data.user);
      setProfileMsg("Admin profile updated successfully!");
    } catch (err) {
      setProfileErr(err.response?.data?.message || "Failed to update admin profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");

    if (newPassword !== confirmPassword) {
      setPwdErr("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPwdErr("Password must be at least 6 characters long.");
      return;
    }

    setUpdatingPwd(true);

    try {
      await API.put("/auth/change-password", { currentPassword, newPassword });
      setPwdMsg("Admin password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdErr(err.response?.data?.message || "Failed to update admin password.");
    } finally {
      setUpdatingPwd(false);
    }
  };

  const handleTestChime = () => {
    playNotificationSound("bell");
    setSoundTestMsg("🔔 Chime played!");
    setTimeout(() => setSoundTestMsg(""), 3000);
  };

  const handleTestVoice = () => {
    speakText("New order received for 500 rupees from Jageshwar Cafe test system.");
    setSoundTestMsg("🗣️ Voice announcement played!");
    setTimeout(() => setSoundTestMsg(""), 3000);
  };

  return (
    <div className="dash-container">
      <div className="dash-page-header">
        <h2>Admin Console Settings</h2>
        <p>Manage system notifications, admin profile, and console security credentials</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexDirection: "row", marginTop: "1.5rem" }}>
        
        {/* Sidebar Nav */}
        <div style={{ flex: "0 0 240px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button 
            className={`dash-action-card ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "10px", background: activeTab === "profile" ? "var(--primary)" : "var(--card-bg)", color: activeTab === "profile" ? "white" : "var(--text)", cursor: "pointer", transition: "all 0.2s" }}
          >
            👤 Admin Profile
          </button>
          <button 
            className={`dash-action-card ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
            style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "10px", background: activeTab === "security" ? "var(--primary)" : "var(--card-bg)", color: activeTab === "security" ? "white" : "var(--text)", cursor: "pointer", transition: "all 0.2s" }}
          >
            🔑 Security Settings
          </button>
          <button 
            className={`dash-action-card ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
            style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "10px", background: activeTab === "notifications" ? "var(--primary)" : "var(--card-bg)", color: activeTab === "notifications" ? "white" : "var(--text)", cursor: "pointer", transition: "all 0.2s" }}
          >
            🔔 Sound & Test Alert
          </button>
        </div>

        {/* Content Box */}
        <div style={{ flex: 1, background: "var(--card-bg)", border: "1px solid var(--border)", padding: "2rem", borderRadius: "14px" }}>
          
          {activeTab === "profile" && (
            <div>
              <h3 style={{ marginBottom: "1.5rem" }}>Admin Profile Details</h3>
              {profileMsg && <div style={{ color: "green", marginBottom: "1rem", fontWeight: "bold" }}>{profileMsg}</div>}
              {profileErr && <div style={{ color: "red", marginBottom: "1rem", fontWeight: "bold" }}>{profileErr}</div>}
              
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Base Location (Village)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={village} 
                    onChange={(e) => setVillage(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Detailed Office Address</label>
                  <textarea 
                    className="form-control" 
                    style={{ minHeight: "100px" }}
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="primary-btn" style={{ marginTop: "1rem" }} disabled={updatingProfile}>
                  {updatingProfile ? "Updating Profile..." : "Update Profile"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <h3 style={{ marginBottom: "1.5rem" }}>Change Admin Credentials</h3>
              {pwdMsg && <div style={{ color: "green", marginBottom: "1rem", fontWeight: "bold" }}>{pwdMsg}</div>}
              {pwdErr && <div style={{ color: "red", marginBottom: "1rem", fontWeight: "bold" }}>{pwdErr}</div>}
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter current password"
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Min 6 characters"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Repeat new password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="primary-btn" style={{ marginTop: "1rem" }} disabled={updatingPwd}>
                  {updatingPwd ? "Changing Password..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 style={{ marginBottom: "1rem" }}>Sound Notification Controls</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
                Make sure your system volume is turned up. Since browsers block audio until user interaction occurs, you can click either button below to test your audio configuration and verify real-time alerts are operational.
              </p>

              {soundTestMsg && (
                <div style={{ padding: "10px 15px", background: "rgba(46, 204, 113, 0.15)", border: "1px solid #2ecc71", borderRadius: "8px", color: "#2ecc71", marginBottom: "1.5rem", fontWeight: "600" }}>
                  {soundTestMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <button 
                  onClick={handleTestChime}
                  className="secondary-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px" }}
                >
                  🔔 Test Alert Chime
                </button>

                <button 
                  onClick={handleTestVoice}
                  className="secondary-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px" }}
                >
                  🗣️ Test Voice Assistant
                </button>
              </div>

              <div style={{ marginTop: "2rem", padding: "1.25rem", background: "var(--background)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>💡 Tip on Sound Troubleshooting</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                  If sound test does not output audio, click on the <strong>🔔 Enable Sound Alert</strong> button at the top bar. Browsers restrict tab audio unless the user manually activates audio on the page first.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
