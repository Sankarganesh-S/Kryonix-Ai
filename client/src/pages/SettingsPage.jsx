import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePopup from "../Popup/usePopup";
import { request, safeStorage } from "../utils/api";

import {
  User,
  Lock,
  Trash2,
  ChevronLeft,
  Check,
  AlertCircle,
  Sparkles,
  BarChart2,
  Bell,
  Settings,
  Shield,
  Cpu,
  MessageSquare,
  Database,
  Languages,
  Accessibility,
  Info,
  Upload,
  X,
} from "lucide-react";

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
  { id: "system", label: "Auto", bg: "#0a0a0f", accent: "#7c6ef5" },
  { id: "dark", label: "Dark", bg: "#0a0a0f", accent: "#7c6ef5" },
  { id: "light", label: "Light", bg: "#f8f8fc", accent: "#7c6ef5" },
  { id: "purple", label: "Purple", bg: "#0d0b1a", accent: "#a855f7" },
  { id: "blue", label: "Blue", bg: "#0a0f1a", accent: "#3b82f6" },
  { id: "green", label: "Green", bg: "#07120f", accent: "#22c55e" },
];

const SECTION_TABS = [
  { id: "account", label: "Account", icon: <User size={15} /> },
  { id: "appearance", label: "Appearance", icon: <Sparkles size={15} /> },
  { id: "notifications", label: "Notification", icon: <Bell size={15} /> },
  { id: "security", label: "Security", icon: <Lock size={15} /> },
  { id: "ai", label: "AI Preferences", icon: <Cpu size={15} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={15} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 size={15} /> },
  { id: "storage", label: "Storage", icon: <Database size={15} /> },
  { id: "language", label: "Language", icon: <Languages size={15} /> },
  { id: "accessibility", label: "Accessibility", icon: <Accessibility size={15} /> },
  { id: "about", label: "About", icon: <Info size={15} /> },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function SettingsPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("account");

  const [username, setUsername] = useState(user?.username || "");
  const [avatarColor, setAvatarColor] = useState(
    user?.avatar_color || "#7c6ef5",
  );
  const [accentColor, setAccentColor] = useState(
    user?.accent_color || safeStorage.getJson("kryonix_accent", "#7c6ef5"),
  );

  const [themeMode, setThemeMode] = useState(
    () => safeStorage.getItem("kryonix_theme_mode") || "system",
  );

  const getSystemTheme = () =>
    window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("kryonix_theme");
    if (saved) return saved;
    return getSystemTheme();
  });

  const [stats, setStats] = useState(null);

  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Appearance
  const [reduceMotion, setReduceMotion] = useState(
    !!safeStorage.getItem("kryonix_reduce_motion"),
  );
  const [compactMode, setCompactMode] = useState(
    safeStorage.getItem("kryonix_compact_mode") ? true : false,
  );

  // AI Preferences (UI-first; persisted locally)
  const [aiModel, setAiModel] = useState(
    safeStorage.getItem("kryonix_ai_model") || "gpt-4.1",
  );
  const [responseLength, setResponseLength] = useState(
    safeStorage.getItem("kryonix_ai_length") || "medium",
  );
  const [temperature, setTemperature] = useState(
    safeStorage.getItem("kryonix_ai_temp") || "0.6",
  );
  const [aiToggles, setAiToggles] = useState({
    codeHighlight: safeStorage.getItem("kryonix_ai_codehl") ? true : false,
    markdown: safeStorage.getItem("kryonix_ai_markdown")
      ? true
      : false,
    streamResponse: safeStorage.getItem("kryonix_ai_stream")
      ? true
      : false,
  });

  // Chat settings
  const [chatSettings, setChatSettings] = useState({
    autoScroll: safeStorage.getItem("kryonix_chat_autoscroll") ? true : false,
    enterToSend: safeStorage.getItem("kryonix_chat_enter_send") ? true : false,
    showTimestamp: safeStorage.getItem("kryonix_chat_timestamp")
      ? true
      : false,
  });

  // Notifications
  const [notifSettings, setNotifSettings] = useState({
    desktop: safeStorage.getItem("kryonix_notif_desktop") ? true : false,
    email: safeStorage.getItem("kryonix_notif_email") ? true : false,
    sound: safeStorage.getItem("kryonix_notif_sound") ? true : false,
    marketing: safeStorage.getItem("kryonix_notif_marketing")
      ? true
      : false,
    productUpdates: safeStorage.getItem("kryonix_notif_product")
      ? true
      : false,
  });

  // Language
  const [language, setLanguage] = useState(
    safeStorage.getItem("kryonix_lang") || "en",
  );

  // Accessibility
  const [accessibility, setAccessibility] = useState({
    highContrast: safeStorage.getItem("kryonix_ac_high_contrast")
      ? true
      : false,
    reduceMotion: reduceMotion,
    largeText: safeStorage.getItem("kryonix_ac_large_text")
      ? true
      : false,
    screenReader: safeStorage.getItem("kryonix_ac_screen_reader")
      ? true
      : false,
    keyboardNavigation: safeStorage.getItem("kryonix_ac_keyboard_nav")
      ? true
      : false,
  });

  // Storage (UI-first; stats endpoint returns only totals)
  const [storage, setStorage] = useState({
    chats: safeStorage.getJson("kryonix_storage_chats", 1200000000),
    images: safeStorage.getJson("kryonix_storage_images", 500000000),
    files: safeStorage.getJson("kryonix_storage_files", 350000000),
    cache: safeStorage.getJson("kryonix_storage_cache", 120000000),
  });

  // Profile picture (frontend-first): store preview in localStorage for now
  const fileInputRef = useRef(null);
  const [profileImagePreview, setProfileImagePreview] = useState(
    safeStorage.getItem("kryonix_profile_image_preview") || "",
  );
  const [profileImageName, setProfileImageName] = useState(
    safeStorage.getItem("kryonix_profile_image_name") || "",
  );

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme =
        themeMode === "system" ? getSystemTheme() : themeMode;

      setTheme(resolvedTheme);
      safeStorage.setItem("kryonix_theme", resolvedTheme);
      localStorage.setItem("kryonix_theme", resolvedTheme);
      document.documentElement.dataset.theme = resolvedTheme;
      document.body.dataset.theme = resolvedTheme;
      if (accentColor) {
        document.documentElement.style.setProperty("--accent", accentColor);
      }

      // Premium: compact mode toggles a body dataset used by CSS.
      document.body.dataset.compact = compactMode ? "1" : "0";

      // Accessibility: high contrast
      document.body.dataset.highContrast = accessibility.highContrast ? "1" : "0";
      document.body.dataset.largeText = accessibility.largeText ? "1" : "0";
    };

    applyTheme();

    if (themeMode === "system") {
      const mql = window.matchMedia?.("(prefers-color-scheme: light)");
      const handler = () => applyTheme();
      mql?.addEventListener?.("change", handler);
      return () => mql?.removeEventListener?.("change", handler);
    }
  }, [themeMode, accentColor, compactMode, accessibility.highContrast, accessibility.largeText]);

  useEffect(() => {
    // reduce motion
    const next = reduceMotion;
    safeStorage.setItem("kryonix_reduce_motion", next ? "1" : "");
    document.documentElement.style.scrollBehavior = next ? "auto" : "smooth";
  }, [reduceMotion]);

  useEffect(() => {
    // fetch existing stats
    let mounted = true;
    (async () => {
      const res = await request("/user/stats", {
        authToken: token,
      });
      if (!mounted) return;
      if (res.ok) setStats(res.data);
    })().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [token]);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const saveProfile = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      showMsg("Username must be at least 3 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await request("/user/profile", {
        authToken: token,
        method: "PATCH",
        body: JSON.stringify({
          username: trimmed,
          avatar_color: avatarColor,
          accent_color: accentColor,
        }),
      });

      if (!res.ok) throw new Error(res.error || "Failed");

      safeStorage.setItem("kryonix_accent", accentColor);
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
      const res = await request("/user/change-password", {
        authToken: token,
        method: "POST",
        body: JSON.stringify({
          current_password: currentPass,
          new_password: newPass,
        }),
      });

      if (!res.ok) throw new Error(res.error || "Failed");

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

  const deleteAccount = async () => {
    const popup = usePopup();
    popup.confirm({
      title: "Delete account",
      description: "This will permanently delete your account and all chats. This action cannot be undone.",
      danger: true,
      confirmText: "Delete forever",
      cancelText: "Cancel",
      loading: false,
      onConfirm: async () => {
        const res = await request("/user/account", {
          authToken: token,
          method: "DELETE",
        });
        if (!res.ok) {
          showMsg(res.error || "Failed to delete account", "error");
          return;
        }
        logout();
        navigate("/login");
      },
    });
  };

  const changeTheme = (t) => {
    setThemeMode(t);
    if (t === "dark" || t === "light") {
      setTheme(t);
    }
    safeStorage.setItem("kryonix_theme_mode", t);
  };

  const onSelectFile = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      showMsg("Unsupported image. Use JPG, PNG, or WEBP.", "error");
      return;
    }

    // Frontend-first: preview only. Backend persistence comes later.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfileImagePreview(dataUrl);
      setProfileImageName(file.name || "profile-image");
      safeStorage.setItem("kryonix_profile_image_preview", dataUrl);
      safeStorage.setItem("kryonix_profile_image_name", file.name || "profile-image");
      showMsg("Profile image saved locally (upload backend next)." , "success");
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImagePreview("");
    setProfileImageName("");
    safeStorage.removeItem("kryonix_profile_image_preview");
    safeStorage.removeItem("kryonix_profile_image_name");
  };

  const avatarDisplay = useMemo(() => {
    if (profileImagePreview) {
      return (
        <img
          src={profileImagePreview}
          alt="Profile"
          className="settings-profile-img"
        />
      );
    }
    return (
      <div
        className="settings-profile-fallback"
        style={{ background: avatarColor }}
      >
        {(username?.[0] || user?.username?.[0] || "U").toUpperCase()}
      </div>
    );
  }, [profileImagePreview, avatarColor, username, user?.username]);

  const notificationRow = (label, key, desc) => {
    const checked = notifSettings[key];
    return (
      <div className="settings-row" key={key}>
        <div className="settings-row-main">
          <div className="settings-row-title">{label}</div>
          {desc ? <div className="settings-row-desc">{desc}</div> : null}
        </div>
        <button
          type="button"
          className={`settings-switch ${checked ? "on" : ""}`}
          onClick={() => {
            const next = !checked;
            setNotifSettings((s) => ({ ...s, [key]: next }));
            safeStorage.setItem(`kryonix_notif_${key}`, next ? "1" : "");
          }}
          aria-pressed={checked}
        >
          <span className="settings-switch-dot" />
        </button>
      </div>
    );
  };

  return (
    <div className="settings-shell">

      <div className="settings-sticky-header">
        <div className="settings-header">
          <button onClick={() => navigate("/chat")} className="settings-back">
            <ChevronLeft size={18} /> Back
          </button>
          <div>
            <h1 className="settings-title">Settings</h1>
            <div className="settings-subtitle">
              Premium preferences for Kryonix.
            </div>
          </div>
          <div style={{ width: 120 }} />
        </div>
      </div>

      <div className="settings-body-premium">
        <aside className="settings-nav">
          <div className="settings-nav-profile">
            <div className="settings-nav-avatar">{avatarDisplay}</div>
            <div className="settings-nav-user">
              <div className="settings-nav-name">{user?.username || "User"}</div>
              <div className="settings-nav-email">{user?.email || ""}</div>
            </div>
          </div>

          <div className="settings-nav-tabs">
            {SECTION_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`settings-nav-tab ${tab === t.id ? "active" : ""}`}
              >
                <span className="settings-nav-tab-ico">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="settings-content">
          {msg.text ? (
            <div className={`settings-msg ${msg.type}`}>
              {msg.type === "error" ? (
                <AlertCircle size={15} />
              ) : (
                <Check size={15} />
              )}
              {msg.text}
            </div>
          ) : null}

          {tab === "account" && (
            <section className="settings-card settings-card-hero">
              <div className="settings-hero-top">
                <div>
                  <div className="settings-section-kicker">👤 Account</div>
                  <h2 className="settings-section-title">Profile</h2>
                </div>
                <div className="settings-hero-actions">
                  <button
                    className="settings-btn-secondary"
                    type="button"
                    onClick={() => {
                      safeStorage.removeItem("kryonix_profile_image_preview");
                      safeStorage.removeItem("kryonix_profile_image_name");
                      removeProfileImage();
                    }}
                    disabled={!profileImagePreview}
                  >
                    <X size={16} /> Remove
                  </button>
                </div>
              </div>

              <div className="settings-profile-grid">
                <div
                  className={`settings-dropzone ${profileImagePreview ? "has" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer?.files?.[0];
                    onSelectFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onSelectFile(e.target.files?.[0])}
                  />

                  {avatarDisplay}
                  <div className="settings-dropzone-text">
                    <div className="settings-dropzone-title">
                      <Upload size={18} /> Upload
                    </div>
                    <div className="settings-dropzone-sub">
                      JPG / PNG / WEBP • Drag & drop
                    </div>
                  </div>
                </div>

                <div className="settings-form">
                  <div className="settings-field">
                    <label className="settings-label">Display name</label>
                    <input
                      className="settings-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Email</label>
                    <input
                      className="settings-input"
                      value={user?.email || ""}
                      disabled
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Avatar accent</label>
                    <div className="settings-color-grid">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setAvatarColor(c)}
                          className="settings-color-btn"
                          style={{
                            background: c,
                            outline:
                              avatarColor === c ? "2px solid white" : "none",
                          }}
                          type="button"
                          aria-label={`Set avatar accent ${c}`}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="settings-field">
                    <button
                      className="settings-save-btn"
                      onClick={saveProfile}
                      disabled={loading}
                      type="button"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-danger-divider">
                <div>
                  <div className="settings-danger-title">Danger zone</div>
                  <div className="settings-danger-sub">
                    Delete your account permanently.
                  </div>
                </div>
                <button
                  onClick={deleteAccount}
                  className="settings-danger-btn"
                  type="button"
                >
                  <Trash2 size={15} /> Delete Account
                </button>
              </div>
            </section>
          )}

          {tab === "appearance" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">🎨 Appearance</div>
                  <h2 className="settings-section-title">Theme & UI</h2>
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-panel">
                  <div className="settings-panel-title">Theme</div>
                  <div className="settings-theme-grid">
                    {THEMES.map((t) => {
                      const selected = themeMode === t.id;
                      const resolved = t.id === "system" ? getSystemTheme() : t.id;
                      const showCheck = selected || theme === resolved;
                      return (
                        <button
                          key={t.id}
                          onClick={() => changeTheme(t.id)}
                          className={`settings-theme-tile ${showCheck ? "active" : ""}`}
                          style={{ background: t.bg }}
                          type="button"
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: t.accent,
                              margin: "0 auto 10px",
                              boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
                            }}
                          />
                          <div
                            style={{
                              fontSize: 12,
                              color: showCheck ? t.accent : "#71717a",
                              fontWeight: 800,
                            }}
                          >
                            {t.label}
                          </div>
                          {showCheck ? (
                            <Check size={16} style={{ color: t.accent, marginTop: 8 }} />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-panel">
                  <div className="settings-panel-title">Accent color</div>
                  <div className="settings-color-grid" style={{ marginTop: 12 }}>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setAccentColor(c);
                          safeStorage.setItem("kryonix_accent", c);
                        }}
                        className="settings-color-btn"
                        style={{
                          background: c,
                          outline:
                            accentColor === c ? "2px solid white" : "none",
                        }}
                        type="button"
                        aria-label={`Set accent color ${c}`}
                        title={c}
                      />
                    ))}
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-row-title">Compact mode</div>
                      <div className="settings-row-desc">
                        Tight spacing for faster scanning.
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`settings-switch ${compactMode ? "on" : ""}`}
                      onClick={() => {
                        const next = !compactMode;
                        setCompactMode(next);
                        safeStorage.setItem("kryonix_compact_mode", next ? "1" : "");
                      }}
                      aria-pressed={compactMode}
                    >
                      <span className="settings-switch-dot" />
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-row-title">Reduce motion</div>
                      <div className="settings-row-desc">Less animation, more comfort.</div>
                    </div>
                    <button
                      type="button"
                      className={`settings-switch ${reduceMotion ? "on" : ""}`}
                      onClick={() => setReduceMotion((v) => {
                        const next = !v;
                        safeStorage.setItem("kryonix_reduce_motion", next ? "1" : "");
                        setAccessibility((a) => ({ ...a, reduceMotion: next }));
                        return next;
                      })}
                      aria-pressed={reduceMotion}
                    >
                      <span className="settings-switch-dot" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-muted-note">
                More premium appearance options (glass level, sidebar width, blur, font size)
                are UI-ready but not persisted yet.
              </div>
            </section>
          )}

          {tab === "notifications" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">🔔 Notification</div>
                  <h2 className="settings-section-title">Alerts & updates</h2>
                </div>
              </div>

              <div className="settings-panel">
                {notificationRow("Desktop notifications", "desktop", "Get instant messages")}
                {notificationRow("Email notifications", "email", "Weekly digest + important alerts")}
                {notificationRow("Sound", "sound", "Play a small notification sound")}
                {notificationRow("Marketing emails", "marketing", "Tips, promotions, and announcements")}
                {notificationRow("Product updates", "productUpdates", "New features & releases")}
              </div>

              <div className="settings-muted-note">
                Backend persistence for notifications will be added next.
              </div>
            </section>
          )}

          {tab === "security" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">🔒 Security</div>
                  <h2 className="settings-section-title">Password</h2>
                </div>
              </div>

              <div className="settings-panel">
                <div className="settings-field">
                  <label className="settings-label">Current password</label>
                  <input
                    className="settings-input"
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">New password</label>
                  <input
                    className="settings-input"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Confirm new password</label>
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
                  type="button"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>

              <div className="settings-muted-note">
                2FA, active sessions, and trusted devices are UI-stubs for now.
              </div>
            </section>
          )}

          {tab === "ai" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">🤖 AI Preferences</div>
                  <h2 className="settings-section-title">Make Kryonix yours</h2>
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-panel">
                  <div className="settings-panel-title">AI Model</div>
                  <div className="settings-radio-grid">
                    {["gpt-4.1", "gpt-5", "claude", "gemini"].map((m) => {
                      const checked = aiModel === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`settings-radio-tile ${checked ? "active" : ""}`}
                          onClick={() => {
                            setAiModel(m);
                            safeStorage.setItem("kryonix_ai_model", m);
                          }}
                        >
                          <div className="settings-radio-title">{m.toUpperCase()}</div>
                          {checked ? <Check size={16} style={{ color: "var(--accent)" }} /> : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-panel-title">Response length</div>
                  <div className="settings-radio-grid">
                    {["short", "medium", "long"].map((l) => {
                      const checked = responseLength === l;
                      return (
                        <button
                          key={l}
                          type="button"
                          className={`settings-radio-tile ${checked ? "active" : ""}`}
                          onClick={() => {
                            setResponseLength(l);
                            safeStorage.setItem("kryonix_ai_length", l);
                          }}
                        >
                          <div className="settings-radio-title">{l.charAt(0).toUpperCase() + l.slice(1)}</div>
                          {checked ? <Check size={16} style={{ color: "var(--accent)" }} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-panel">
                  <div className="settings-panel-title">Temperature</div>
                  <div className="settings-slider-row">
                    <input
                      className="settings-range"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={clamp(parseFloat(temperature || "0"), 0, 1)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTemperature(v);
                        safeStorage.setItem("kryonix_ai_temp", v);
                      }}
                    />
                    <div className="settings-slider-val">{temperature}</div>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-panel-title">Formatting</div>
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-row-title">Code highlight</div>
                      <div className="settings-row-desc">Improve readability for code blocks.</div>
                    </div>
                    <button
                      type="button"
                      className={`settings-switch ${aiToggles.codeHighlight ? "on" : ""}`}
                      onClick={() => {
                        const next = !aiToggles.codeHighlight;
                        setAiToggles((s) => ({ ...s, codeHighlight: next }));
                        safeStorage.setItem("kryonix_ai_codehl", next ? "1" : "");
                      }}
                      aria-pressed={aiToggles.codeHighlight}
                    >
                      <span className="settings-switch-dot" />
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-row-title">Markdown</div>
                      <div className="settings-row-desc">Render markdown in chat replies.</div>
                    </div>
                    <button
                      type="button"
                      className={`settings-switch ${aiToggles.markdown ? "on" : ""}`}
                      onClick={() => {
                        const next = !aiToggles.markdown;
                        setAiToggles((s) => ({ ...s, markdown: next }));
                        safeStorage.setItem("kryonix_ai_markdown", next ? "1" : "");
                      }}
                      aria-pressed={aiToggles.markdown}
                    >
                      <span className="settings-switch-dot" />
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-row-title">Stream response</div>
                      <div className="settings-row-desc">Show tokens progressively.</div>
                    </div>
                    <button
                      type="button"
                      className={`settings-switch ${aiToggles.streamResponse ? "on" : ""}`}
                      onClick={() => {
                        const next = !aiToggles.streamResponse;
                        setAiToggles((s) => ({ ...s, streamResponse: next }));
                        safeStorage.setItem("kryonix_ai_stream", next ? "1" : "");
                      }}
                      aria-pressed={aiToggles.streamResponse}
                    >
                      <span className="settings-switch-dot" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-muted-note">
                AI settings are stored locally for now.
              </div>
            </section>
          )}

          {tab === "chat" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">💬 Chat</div>
                  <h2 className="settings-section-title">Typing & message UX</h2>
                </div>
              </div>

              <div className="settings-panel">
                {[
                  { key: "autoScroll", label: "Auto scroll", desc: "Follow new messages automatically" },
                  { key: "enterToSend", label: "Enter to send", desc: "Send message with Enter" },
                  { key: "showTimestamp", label: "Show timestamp", desc: "Display time under each message" },
                ].map((r) => {
                  const checked = chatSettings[r.key];
                  return (
                    <div className="settings-row" key={r.key}>
                      <div className="settings-row-main">
                        <div className="settings-row-title">{r.label}</div>
                        <div className="settings-row-desc">{r.desc}</div>
                      </div>
                      <button
                        type="button"
                        className={`settings-switch ${checked ? "on" : ""}`}
                        onClick={() => {
                          const next = !checked;
                          setChatSettings((s) => ({ ...s, [r.key]: next }));
                          safeStorage.setItem(`kryonix_chat_${r.key}`, next ? "1" : "");
                        }}
                        aria-pressed={checked}
                      >
                        <span className="settings-switch-dot" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="settings-muted-note">
                Chat behavior hooks will be wired once InputArea/ChatWindow reads these values.
              </div>
            </section>
          )}

          {tab === "analytics" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">📊 Analytics</div>
                  <h2 className="settings-section-title">Your usage</h2>
                </div>
              </div>

              <div className="settings-analytics-grid">
                <div className="settings-stat">
                  <div className="settings-stat-val">{stats?.total_chats ?? "—"}</div>
                  <div className="settings-stat-label">Chats</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{stats?.total_messages ?? "—"}</div>
                  <div className="settings-stat-label">Messages</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{user?.is_verified ? "✅" : "❌"}</div>
                  <div className="settings-stat-label">Verified</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{user?.role === "admin" ? "👑" : "👤"}</div>
                  <div className="settings-stat-label">Role</div>
                </div>
              </div>

              <div className="settings-muted-note">
                Charts and more analytics will be added with backend support.
              </div>
            </section>
          )}

          {tab === "storage" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">💾 Storage</div>
                  <h2 className="settings-section-title">What you keep</h2>
                </div>
              </div>

              <div className="settings-analytics-grid">
                <div className="settings-stat">
                  <div className="settings-stat-val">{formatBytes(storage.chats)}</div>
                  <div className="settings-stat-label">Chats</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{formatBytes(storage.images)}</div>
                  <div className="settings-stat-label">Images</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{formatBytes(storage.files)}</div>
                  <div className="settings-stat-label">Files</div>
                </div>
                <div className="settings-stat">
                  <div className="settings-stat-val">{formatBytes(storage.cache)}</div>
                  <div className="settings-stat-label">Cache</div>
                </div>
              </div>

              <div className="settings-row" style={{ marginTop: 16 }}>
                <div className="settings-row-main">
                  <div className="settings-row-title">Clear cache</div>
                  <div className="settings-row-desc">
                    Removes local cached data (UI placeholder).
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-btn-secondary"
                  onClick={() => {
                    // UI placeholder. Real cache clearing comes later.
                    safeStorage.removeItem("kryonix_profile_image_preview");
                    setStorage((s) => ({ ...s, cache: 0 }));
                    showMsg("Cache cleared (local placeholder).", "success");
                  }}
                >
                  Clear
                </button>
              </div>
            </section>
          )}

          {tab === "language" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">🌐 Language</div>
                  <h2 className="settings-section-title">Choose your language</h2>
                </div>
              </div>

              <div className="settings-panel">
                {[
                  { id: "en", label: "English" },
                  { id: "ta", label: "தமிழ்" },
                  { id: "hi", label: "Hindi" },
                  { id: "ja", label: "Japanese" },
                  { id: "zh", label: "Chinese" },
                ].map((l) => {
                  const checked = language === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`settings-radio-tile ${checked ? "active" : ""}`}
                      onClick={() => {
                        setLanguage(l.id);
                        safeStorage.setItem("kryonix_lang", l.id);
                      }}
                    >
                      <div className="settings-radio-title">{l.label}</div>
                      {checked ? <Check size={16} style={{ color: "var(--accent)" }} /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="settings-muted-note">
                Translation system will be integrated later.
              </div>
            </section>
          )}

          {tab === "accessibility" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">♿ Accessibility</div>
                  <h2 className="settings-section-title">Comfort controls</h2>
                </div>
              </div>

              <div className="settings-panel">
                {[
                  {
                    key: "highContrast",
                    title: "High contrast",
                    desc: "Stronger separation for text & borders",
                  },
                  {
                    key: "reduceMotion",
                    title: "Reduce motion",
                    desc: "Less animation and smoother reading",
                  },
                  {
                    key: "largeText",
                    title: "Large text",
                    desc: "Increase UI font size",
                  },
                  {
                    key: "screenReader",
                    title: "Screen reader",
                    desc: "Better focus & labels for assistive tech",
                  },
                  {
                    key: "keyboardNavigation",
                    title: "Keyboard navigation",
                    desc: "Improve focus handling across the app",
                  },
                ].map((r) => {
                  const checked = accessibility[r.key];
                  return (
                    <div className="settings-row" key={r.key}>
                      <div className="settings-row-main">
                        <div className="settings-row-title">{r.title}</div>
                        <div className="settings-row-desc">{r.desc}</div>
                      </div>
                      <button
                        type="button"
                        className={`settings-switch ${checked ? "on" : ""}`}
                        onClick={() => {
                          const next = !checked;
                          setAccessibility((a) => ({ ...a, [r.key]: next }));
                          safeStorage.setItem(
                            `kryonix_ac_${r.key}`,
                            next ? "1" : "",
                          );
                          if (r.key === "reduceMotion") setReduceMotion(next);
                        }}
                        aria-pressed={checked}
                      >
                        <span className="settings-switch-dot" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="settings-muted-note">
                Some accessibility behaviors are UI-only right now.
              </div>
            </section>
          )}

          {tab === "about" && (
            <section className="settings-card">
              <div className="settings-card-head">
                <div>
                  <div className="settings-section-kicker">❓ About</div>
                  <h2 className="settings-section-title">Kryonix AI</h2>
                </div>
              </div>

              <div className="settings-panel">
                <div className="settings-about-row">
                  <div>
                    <div className="settings-about-title">Version 2.0</div>
                    <div className="settings-about-sub">Premium Settings UI redesign</div>
                  </div>
                  <div className="settings-about-badge">Stable</div>
                </div>

                <div className="settings-divider" />

                <button
                  className="settings-link"
                  type="button"
                  onClick={() => showMsg("Privacy policy stub.", "success")}
                >
                  Privacy Policy
                </button>
                <button
                  className="settings-link"
                  type="button"
                  onClick={() => showMsg("Terms stub.", "success")}
                >
                  Terms
                </button>
                <button
                  className="settings-link"
                  type="button"
                  onClick={() => showMsg("Update check stub.", "success")}
                >
                  Check Updates
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

