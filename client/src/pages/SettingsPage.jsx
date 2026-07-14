import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Lock,
  Trash2,
  ChevronLeft,
  Check,
  Sparkles,
  BarChart2,
  AlertCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const COLORS = [
  "#7c6ef5",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];
const THEMES = [
  { id: "dark", label: "Dark", bg: "#0a0a0f", accent: "#7c6ef5" },
  { id: "light", label: "Light", bg: "#f8f8fc", accent: "#7c6ef5" },
  { id: "purple", label: "Purple", bg: "#0d0b1a", accent: "#a855f7" },
  { id: "blue", label: "Blue", bg: "#0a0f1a", accent: "#3b82f6" },
];

export default function SettingsPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarColor, setAvatarColor] = useState("#7c6ef5");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("kryonix_theme") || "dark",
  );
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetch(`${API}/user/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/user/profile`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ username, avatar_color: avatarColor }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      showMsg("Profile updated!");
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (newPass !== confirmPass) {
      showMsg("Passwords do not match", "error");
      return;
    }
    if (newPass.length < 6) {
      showMsg("Min 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/user/change-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          current_password: currentPass,
          new_password: newPass,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      showMsg("Password changed!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const changeTheme = (t) => {
    setTheme(t);
    localStorage.setItem("kryonix_theme", t);
    document.documentElement.dataset.theme = t;
    document.body.dataset.theme = t;
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete your account and all chats.",
      )
    )
      return;
    await fetch(`${API}/user/account`, { method: "DELETE", headers });
    logout();
    navigate("/login");
  };

  return (
    <div className="settings-shell">
      {/* Header */}
      <div className="settings-header">
        <button onClick={() => navigate("/chat")} className="settings-back">
          <ChevronLeft size={18} /> Back
        </button>
        <h1 className="settings-title">Settings</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className="settings-body">
        {/* Tabs */}
        <div className="settings-tabs">
          {[
            { id: "profile", label: "Profile", icon: <User size={15} /> },
            {
              id: "appearance",
              label: "Appearance",
              icon: <Sparkles size={15} />,
            },
            { id: "security", label: "Security", icon: <Lock size={15} /> },
            { id: "stats", label: "Stats", icon: <BarChart2 size={15} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`settings-tab ${tab === t.id ? "active" : ""}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {msg.text && (
          <div className={`settings-msg ${msg.type}`}>
            {msg.type === "error" ? (
              <AlertCircle size={15} />
            ) : (
              <Check size={15} />
            )}
            {msg.text}
          </div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="settings-card">
            <h2 className="settings-section-title">Profile</h2>

            {/* Avatar */}
            <div className="settings-avatar-row">
              <div
                className="settings-avatar"
                style={{ background: avatarColor }}
              >
                {username?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="settings-label">Avatar Color</p>
                <div className="settings-color-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className="settings-color-btn"
                      style={{
                        background: c,
                        outline: avatarColor === c ? `2px solid white` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Username</label>
              <input
                className="settings-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Email</label>
              <input
                className="settings-input"
                value={user?.email || ""}
                disabled
                style={{ opacity: 0.5 }}
              />
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Email cannot be changed
              </p>
            </div>

            <button
              onClick={saveProfile}
              disabled={loading}
              className="settings-save-btn"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  color: "var(--red)",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Danger Zone
              </h3>
              <button onClick={deleteAccount} className="settings-danger-btn">
                <Trash2 size={15} /> Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {tab === "appearance" && (
          <div className="settings-card">
            <h2 className="settings-section-title">Appearance</h2>
            <p className="settings-label" style={{ marginBottom: 16 }}>
              Theme
            </p>
            <div className="settings-theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  className={`settings-theme-btn ${theme === t.id ? "active" : ""}`}
                  style={{ background: t.bg }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: t.accent,
                      margin: "0 auto 8px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: theme === t.id ? t.accent : "#71717a",
                      fontWeight: 600,
                    }}
                  >
                    {t.label}
                  </span>
                  {theme === t.id && (
                    <Check
                      size={14}
                      style={{
                        color: t.accent,
                        display: "block",
                        margin: "4px auto 0",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === "security" && (
          <div className="settings-card">
            <h2 className="settings-section-title">Change Password</h2>
            <div className="settings-field">
              <label className="settings-label">Current Password</label>
              <input
                className="settings-input"
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <input
                className="settings-input"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Confirm New Password</label>
              <input
                className="settings-input"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <button
              onClick={changePassword}
              disabled={loading}
              className="settings-save-btn"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        )}

        {/* Stats Tab */}
        {tab === "stats" && (
          <div className="settings-card">
            <h2 className="settings-section-title">Your Stats</h2>
            <div className="settings-stats-grid">
              <div className="settings-stat">
                <div className="settings-stat-val">
                  {stats?.total_chats ?? "—"}
                </div>
                <div className="settings-stat-label">Total Chats</div>
              </div>
              <div className="settings-stat">
                <div className="settings-stat-val">
                  {stats?.total_messages ?? "—"}
                </div>
                <div className="settings-stat-label">Messages</div>
              </div>
              <div className="settings-stat">
                <div className="settings-stat-val">
                  {user?.role === "admin" ? "👑" : "👤"}
                </div>
                <div className="settings-stat-label">Role: {user?.role}</div>
              </div>
              <div className="settings-stat">
                <div className="settings-stat-val">
                  {user?.is_verified ? "✅" : "❌"}
                </div>
                <div className="settings-stat-label">Verified</div>
              </div>
            </div>
            {stats?.member_since && (
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  marginTop: 20,
                  textAlign: "center",
                }}
              >
                Member since{" "}
                {new Date(stats.member_since).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
