import { useState } from "react";
import axios from "axios";
import "./ReportDialog.css";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "Misinformation" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
];

// Small modal to report a post (optionally a comment under it).
// The report goes to the moderators of that post's club (or the admins).
export default function ReportDialog({ postId, commentId, onClose, onReported }) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/reports`,
        { postId, commentId, reason, details },
        { withCredentials: true }
      );
      onReported?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to file report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Report this {commentId ? "comment" : "post"}</h3>
        <p className="report-sub">
          Moderators of this club will review your report.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="report-label">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="report-select"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="report-label">
            Details (optional)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={300}
              rows={3}
              className="report-textarea"
              placeholder="Add any extra context for the moderators…"
            />
          </label>
          {error && <p className="report-error">{error}</p>}
          <div className="report-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Reporting…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
