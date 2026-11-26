import { useEffect, useState } from "react";
import {
  FaUsers,
  FaShieldAlt,
  FaLayerGroup,
  FaClock,
  FaFlag,
  FaCalendarAlt,
  FaBullhorn,
} from "react-icons/fa";
import axios from "axios";
import "./AdminPanel.css";
import AnnouncementCard from "../Announcements/AnnouncementCard.jsx";
import ModeratorQueue from "../../components/Moderation/ModeratorQueue.jsx";

const API = import.meta.env.VITE_API_URL;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "requests", label: "Club Requests" },
  { key: "users", label: "Users" },
  { key: "reports", label: "Reports" },
  { key: "announcements", label: "Announcements" },
  { key: "events", label: "Events" },
];

export default function AdminPanel({ currentUser }) {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annCategory, setAnnCategory] = useState("Important Updates");
  const [annLink, setAnnLink] = useState("");
  const [annFile, setAnnFile] = useState(null);

  const loadOverview = async () => {
    const res = await axios.get(`${API}/admin/overview`, { withCredentials: true });
    setOverview(res.data);
  };

  const loadRequests = async () => {
    const res = await axios.get(`${API}/club-requests`, {
      params: { status: "pending" },
      withCredentials: true,
    });
    setRequests(res.data);
  };

  const loadUsers = async () => {
    const res = await axios.get(`${API}/admin/users`, { withCredentials: true });
    setUsers(res.data.users || []);
  };

  const loadAnnouncements = async () => {
    const res = await axios.get(`${API}/announcements`, { withCredentials: true });
    setAnnouncements(res.data);
  };

  const loadEvents = async () => {
    const res = await axios.get(`${API}/events`, {
      params: { filter: "all" },
      withCredentials: true,
    });
    setEvents(res.data);
  };

  const loadTab = async (t) => {
    setLoading(true);
    setError("");
    try {
      if (t === "overview") await loadOverview();
      if (t === "requests") await loadRequests();
      if (t === "users") await loadUsers();
      if (t === "announcements") await loadAnnouncements();
      if (t === "events") await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleRequest = async (id, action) => {
    try {
      await axios.post(`${API}/club-requests/${id}/${action}`, {}, { withCredentials: true });
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await axios.patch(
        `${API}/admin/users/${user._id}/role`,
        { role },
        { withCredentials: true }
      );
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change role");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let attachments = [];
      if (annFile) {
        const formData = new FormData();
        formData.append("document", annFile);
        const up = await axios.post(`${API}/upload/document`, formData, {
          withCredentials: true,
        });
        attachments = [up.data.documentUrl];
      }
      await axios.post(
        `${API}/announcements`,
        {
          title: annTitle,
          content: annContent,
          category: annCategory,
          link: annLink,
          attachments,
          isGlobal: true,
        },
        { withCredentials: true }
      );
      setAnnTitle("");
      setAnnContent("");
      setAnnLink("");
      setAnnFile(null);
      loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`${API}/announcements/${id}`, { withCredentials: true });
      loadAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p className="admin-sub">
        Signed in as {currentUser?.username}
        {currentUser?.adminTitle ? ` (${currentUser.adminTitle})` : " (Admin)"}
      </p>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>Loading…</p>}

      {tab === "overview" && overview && (
        <div className="admin-stats">
          <div className="stat-card stat-card--primary">
            <span className="stat-icon"><FaUsers /></span>
            <strong>{overview.totalUsers}</strong>
            <span>Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaShieldAlt /></span>
            <strong>{overview.totalAdmins}</strong>
            <span>Admins</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaLayerGroup /></span>
            <strong>{overview.totalClubs}</strong>
            <span>Clubs</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaClock /></span>
            <strong>{overview.pendingRequests}</strong>
            <span>Pending club requests</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaFlag /></span>
            <strong>{overview.openReports}</strong>
            <span>Open reports</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaCalendarAlt /></span>
            <strong>{overview.upcomingEvents}</strong>
            <span>Upcoming events</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><FaBullhorn /></span>
            <strong>{overview.totalAnnouncements}</strong>
            <span>Announcements</span>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div>
          {requests.length === 0 && <p>No pending club requests.</p>}
          {requests.map((r) => (
            <div key={r._id} className="admin-row">
              <div>
                <strong>{r.club?.title || r.club?.name}</strong>
                <span className="admin-muted"> ({r.club?.name})</span>
                <p>{r.club?.description}</p>
                <p className="admin-muted">
                  Requested by {r.user?.username} ({r.user?.email}) ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="admin-row-actions">
                <button className="btn primary" onClick={() => handleRequest(r._id, "approve")}>
                  Approve
                </button>
                <button className="btn danger" onClick={() => handleRequest(r._id, "reject")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div>
          {users.map((u) => (
            <div key={u._id} className="admin-row">
              <div>
                <strong>{u.username}</strong>
                <span className="admin-muted"> {u.email}</span>
                <p className="admin-muted">
                  Role: {u.role}
                  {u.adminTitle ? ` (${u.adminTitle})` : ""} · Joined{" "}
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="admin-row-actions">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value)}
                  disabled={u._id === currentUser?._id}
                >
                  <option value="student">Student</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && <ModeratorQueue />}

      {tab === "announcements" && (
        <div>
          <form className="admin-ann-form" onSubmit={handleCreateAnnouncement}>
            <h3>Publish an announcement</h3>
            <input
              placeholder="Title (optional)"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
            />
            <textarea
              placeholder="Announcement text…"
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              required
              rows={4}
            />
            <div className="admin-ann-row">
              <select
                value={annCategory}
                onChange={(e) => setAnnCategory(e.target.value)}
              >
                <option>Event Notices</option>
                <option>Important Updates</option>
                <option>Club & Group Announcements</option>
                <option>Achievements & Highlights</option>
              </select>
              <input
                placeholder="Link (optional)"
                value={annLink}
                onChange={(e) => setAnnLink(e.target.value)}
              />
            </div>
            <label className="admin-file-label">
              Attach a document (optional):
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setAnnFile(e.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" className="btn primary">
              Publish announcement
            </button>
          </form>

          <h3>Published announcements</h3>
          {announcements.length === 0 && <p>No announcements yet.</p>}
          {announcements.map((a) => (
            <AnnouncementCard
              key={a._id}
              announcement={a}
              canDelete
              onDelete={handleDeleteAnnouncement}
            />
          ))}
        </div>
      )}

      {tab === "events" && (
        <div>
          <p>
            Manage events on the <a href="/events">Events page</a> (create, edit,
            cancel, delete). All events:
          </p>
          {events.map((e) => (
            <div key={e._id} className="admin-row">
              <div>
                <strong>{e.title}</strong>
                <span className="admin-muted"> · {e.category}</span>
                <p className="admin-muted">
                  {new Date(e.date).toLocaleDateString()} · {e.time} · {e.venue} ·{" "}
                  {e.status} · {e.registeredCount || 0} registered
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
