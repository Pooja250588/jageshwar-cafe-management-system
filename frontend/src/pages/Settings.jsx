import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { playNotificationSound } from "../utils/notificationSound";

function Settings() {
  const { user, updateUser } = useContext(AuthContext);
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

  // Notification Preference States (stored in LocalStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("soundEnabled") !== "false";
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem("voiceEnabled") !== "false";
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setVillage(user.village || "");
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
      setProfileMsg("Profile updated successfully!");
    } catch (err) {
      setProfileErr(err.response?.data?.message || "Failed to update profile.");
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
      setPwdMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdErr(err.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPwd(false);
    }
  };

  const handleSoundToggle = (val) => {
    setSoundEnabled(val);
    localStorage.setItem("soundEnabled", String(val));
    if (val) {
      playNotificationSound("success");
    }
  };

  const handleVoiceToggle = (val) => {
    setVoiceEnabled(val);
    localStorage.setItem("voiceEnabled", String(val));
  };

  if (!user) {
    return (
      <div className="page-container" style={{ textAlign: "center" }}>
        <div className="form-card" style={{ padding: "4rem" }}>
          <span>🔒</span>
          <h2>Access Denied</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Please log in to manage your cafe settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="settings-wrapper" style={{ display: "flex", gap: "2rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        {/* Settings Sidebar */}
        <div className="settings-sidebar" style={{ flex: "0 0 250px", background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>⚙️ Settings</h2>
          <button 
            className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            style={{ width: "100%", textAlign: "left", padding: "10px 15px", border: "none", borderRadius: "8px", background: activeTab === "profile" ? "var(--primary)" : "transparent", color: activeTab === "profile" ? "white" : "var(--text)", fontWeight: "500", cursor: "pointer" }}
          >
            👤 Edit Profile
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
            style={{ width: "100%", textAlign: "left", padding: "10px 15px", border: "none", borderRadius: "8px", background: activeTab === "security" ? "var(--primary)" : "transparent", color: activeTab === "security" ? "white" : "var(--text)", fontWeight: "500", cursor: "pointer" }}
          >
            🔒 Security / Password
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
            style={{ width: "100%", textAlign: "left", padding: "10px 15px", border: "none", borderRadius: "8px", background: activeTab === "preferences" ? "var(--primary)" : "transparent", color: activeTab === "preferences" ? "white" : "var(--text)", fontWeight: "500", cursor: "pointer" }}
          >
            🔔 Sound & Alerts
          </button>
        </div>

        {/* Settings Main Content Area */}
        <div className="settings-content-card" style={{ flex: 1, background: "var(--card-bg)", padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--border)", minHeight: "400px" }}>
          
          {/* Tab 1: Profile Details */}
          {activeTab === "profile" && (
            <div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Profile Information</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Update your account details and default delivery address.
              </p>
              {profileMsg && <div style={{ color: "green", marginBottom: "1rem", fontWeight: "bold" }}>{profileMsg}</div>}
              {profileErr && <div style={{ color: "red", marginBottom: "1rem", fontWeight: "bold" }}>{profileErr}</div>}
              
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Village</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={village} 
                    onChange={(e) => setVillage(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Detailed Address / Landmark</label>
                  <textarea 
                    className="form-control" 
                    style={{ minHeight: "100px", resize: "vertical" }}
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="primary-btn" disabled={updatingProfile} style={{ marginTop: "1rem" }}>
                  {updatingProfile ? "Saving Changes..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === "security" && (
            <div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Change Password</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Ensure your account is secure by regularly updating your password.
              </p>
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
                <button type="submit" className="primary-btn" disabled={updatingPwd} style={{ marginTop: "1rem" }}>
                  {updatingPwd ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Sound & Alerts */}
          {activeTab === "preferences" && (
            <div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Sound & Alerts</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Customize your notifications and alert options.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                
                {/* Sound toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Chime Alerts</h4>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                      Play a gentle chime when order status updates
                    </p>
                  </div>
                  <div>
                    <div style={{ position: "relative", display: "inline-block", width: "42px", height: "22px" }}>
                      <input 
                        type="checkbox" 
                        id="sound-toggle"
                        checked={soundEnabled} 
                        onChange={(e) => handleSoundToggle(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <label 
                        htmlFor="sound-toggle"
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: soundEnabled ? "#ff6b35" : "#cbd5e1",
                          transition: "0.2s",
                          borderRadius: "22px"
                        }}
                      >
                        <span style={{
                          position: "absolute",
                          content: '""',
                          height: "16px", width: "16px",
                          left: soundEnabled ? "22px" : "4px",
                          bottom: "3px",
                          backgroundColor: "white",
                          transition: "0.2s",
                          borderRadius: "50%",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Voice toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.25rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Voice Announcements</h4>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                      Aloud text announcements for important events
                    </p>
                  </div>
                  <div>
                    <div style={{ position: "relative", display: "inline-block", width: "42px", height: "22px" }}>
                      <input 
                        type="checkbox" 
                        id="voice-toggle"
                        checked={voiceEnabled} 
                        onChange={(e) => handleVoiceToggle(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <label 
                        htmlFor="voice-toggle"
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: voiceEnabled ? "#ff6b35" : "#cbd5e1",
                          transition: "0.2s",
                          borderRadius: "22px"
                        }}
                      >
                        <span style={{
                          position: "absolute",
                          content: '""',
                          height: "16px", width: "16px",
                          left: voiceEnabled ? "22px" : "4px",
                          bottom: "3px",
                          backgroundColor: "white",
                          transition: "0.2s",
                          borderRadius: "50%",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }} />
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Settings;
