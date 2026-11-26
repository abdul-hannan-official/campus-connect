import { useEffect, useState } from "react";
import axios from "axios";
import "./ModeratorQueue.css";

// The moderation queue: open reports filed against posts/comments.
// Admins see all reports; club moderators see only their clubs' reports
// (pass clubId to scope the queue to one club).
export default function ModeratorQueue({ clubId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/reports`, {
        params: { status: "open", ...(clubId ? { clubId } : {}) },
        withCredentials: true,
      });
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const handleResolve = async (report, action) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/reports/${report._id}/resolve`,
        { action },
        { withCredentials: true }
      );
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve report");
    }
  };

  if (loading) return <p>Loading reports…</p>;
  if (error) return <p className="queue-error">{error}</p>;
  if (reports.length === 0) return <p>No open reports. 🎉</p>;

  return (
    <div className="moderator-queue">
      {reports.map((r) => (
        <div key={r._id} className="report-row">
          <div>
            <strong>{r.reason.replaceAll("_", " ")}</strong>
            <span className="report-meta">
              {" "}
              · reported by {r.reporter?.username || "someone"} ·{" "}
              {new Date(r.createdAt).toLocaleString()}
            </span>
            {r.details && <p className="report-details">“{r.details}”</p>}
            <p className="report-post">
              Post:{" "}
              <a href={`/posts/${r.post?._id}`} target="_blank" rel="noreferrer">
                {r.post?.title || "(deleted post)"}
              </a>
              {r.comment && (
                <span> · Comment: “{r.comment.content}”</span>
              )}
              {r.post?.isRemoved && <span> · (already removed)</span>}
            </p>
          </div>
          <div className="report-actions">
            <button
              className="btn danger"
              onClick={() => handleResolve(r, "remove_post")}
            >
              Remove post
            </button>
            {r.comment && (
              <button
                className="btn danger"
                onClick={() => handleResolve(r, "remove_comment")}
              >
                Remove comment
              </button>
            )}
            <button
              className="btn secondary"
              onClick={() => handleResolve(r, "dismiss")}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
