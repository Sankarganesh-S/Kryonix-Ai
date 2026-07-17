import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  MessageSquare,
  Activity,
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";

import { usePopup } from "../Popup";



const API = import.meta.env.VITE_API_BASE_URL || "/api";

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="admin-stat-val">{value ?? "—"}</div>
        <div className="admin-stat-label">{label}</div>
        {sub && <div className="admin-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { token } = useAuth();

  const navigate = useNavigate();
  const { confirm: confirmPopup } = usePopup();


  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const loadStats = () =>
    fetch(`${API}/admin/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  const loadUsers = () =>
    fetch(`${API}/admin/users?limit=100`, { headers })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => {});
  const loadChats = () =>
    fetch(`${API}/admin/chats?limit=100`, { headers })
      .then((r) => r.json())
      .then((d) => setChats(d.chats || []))
      .catch(() => {});

  useEffect(() => {
    loadStats();
    loadUsers();
    loadChats();
  }, []);

  const toggleActive = async (id) => {
    setBusyId(id);
    await fetch(`${API}/admin/users/${id}/toggle-active`, {
      method: "PATCH",
      headers,
    })
      .then((r) => r.json())
      .then((d) =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, is_active: d.is_active } : u)),
        ),
      )
      .catch(() => {});
    setBusyId(null);
  };

  const deleteUser = async (id) => {
    if (busyId) return;

    confirmPopup({
      type: "confirm",
      variant: "confirm",
      danger: true,
      title: "Delete user",
      description: "Delete this user and all their chats?",
      confirmText: "Delete",
      cancelText: "Cancel",
      loading: false,
      onConfirm: async () => {
        setBusyId(id);
        await fetch(`${API}/admin/users/${id}`, {
          method: "DELETE",
          headers,
        }).catch(() => {});
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setBusyId(null);
        loadStats();
      },
    });
  };

  const setRole = async (id, role) => {
    setBusyId(id);
    await fetch(`${API}/admin/users/${id}/set-role?role=${role}`, {
      method: "PATCH",
      headers,
    })
      .then((r) => r.json())
      .then((d) =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: d.role } : u)),
        ),
      )
      .catch(() => {});
    setBusyId(null);
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-nav">
        <div className="admin-brand">
          <Shield size={20} color="#7c6ef5" />
          <span>Admin Panel</span>
        </div>
        {["overview", "users", "chats"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`admin-nav-btn ${tab === t ? "active" : ""}`}
          >
            {t === "overview" && <Activity size={16} />}
            {t === "users" && <Users size={16} />}
            {t === "chats" && <MessageSquare size={16} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ marginTop: "auto" }}>
          <button onClick={() => navigate("/chat")} className="admin-nav-btn">
            <ChevronLeft size={16} /> Back to Chat
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-title">
            {tab === "overview" && "Overview"}
            {tab === "users" && `Users (${users.length})`}
            {tab === "chats" && `All Chats (${chats.length})`}
          </h1>
          <button
            onClick={() => {
              loadStats();
              loadUsers();
              loadChats();
            }}
            className="admin-refresh"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div>
            <div className="admin-stats-grid">
              <StatCard
                icon={<Users size={20} color="white" />}
                label="Total Users"
                value={stats.total_users}
                sub={`+${stats.new_users_7d} this week`}
                color="linear-gradient(135deg,#7c6ef5,#5b4de0)"
              />
              <StatCard
                icon={<CheckCircle size={20} color="white" />}
                label="Verified"
                value={stats.verified_users}
                sub={`${stats.active_users} active`}
                color="linear-gradient(135deg,#22c55e,#16a34a)"
              />
              <StatCard
                icon={<MessageSquare size={20} color="white" />}
                label="Total Chats"
                value={stats.total_chats}
                sub={`+${stats.new_chats_7d} this week`}
                color="linear-gradient(135deg,#f59e0b,#d97706)"
              />
              <StatCard
                icon={<Activity size={20} color="white" />}
                label="Messages"
                value={stats.total_messages}
                color="linear-gradient(135deg,#06b6d4,#0891b2)"
              />
            </div>

            {/* Recent users table */}
            <div className="admin-table-wrap" style={{ marginTop: 32 }}>
              <h3 className="admin-section-title">Recent Users</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.username}</strong>
                      </td>
                      <td className="admin-muted">{u.email}</td>
                      <td>
                        <span className={`admin-badge ${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.is_verified ? (
                          <span style={{ color: "#22c55e" }}>✓</span>
                        ) : (
                          <span style={{ color: "#71717a" }}>—</span>
                        )}
                      </td>
                      <td className="admin-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="admin-muted">
                        {u.last_seen
                          ? new Date(u.last_seen).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Chats</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ opacity: busyId === u.id ? 0.5 : 1 }}>
                    <td className="admin-muted">#{u.id}</td>
                    <td>
                      <strong>{u.username}</strong>
                    </td>
                    <td className="admin-muted">{u.email}</td>
                    <td>
                      <select
                        className="admin-select"
                        value={u.role}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        disabled={busyId === u.id}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${u.is_active ? "active" : "inactive"}`}
                      >
                        {u.is_active ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td>{u.chat_count}</td>
                    <td className="admin-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => toggleActive(u.id)}
                          className="admin-action-btn"
                          title={u.is_active ? "Ban user" : "Unban user"}
                          disabled={busyId === u.id}
                        >
                          <Ban size={14} />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="admin-action-btn danger"
                          title="Delete user"
                          disabled={busyId === u.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Chats */}
        {tab === "chats" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Model</th>
                  <th>Messages</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((c) => (
                  <tr key={c.id}>
                    <td className="admin-muted">#{c.id}</td>
                    <td>{c.title || "Untitled"}</td>
                    <td className="admin-muted">{c.username}</td>
                    <td className="admin-muted">{c.model || "—"}</td>
                    <td>{c.message_count}</td>
                    <td className="admin-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
