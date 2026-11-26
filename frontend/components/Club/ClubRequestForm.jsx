import { useState } from "react";
import axios from "axios";
import "./ClubRequestForm.css";

// Request a new club. Submitting creates the club with status "pending"
// and opens a ClubRequest for the admins to approve or reject.
// (The same POST /clubs endpoint is used; students get a pending club,
// admins get an approved one immediately.)
export default function ClubRequestForm({ onClose, onSubmitted }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/clubs`,
        {
          name: name.trim().toLowerCase().replace(/\s+/g, "-"),
          title: title.trim() || name.trim(),
          description,
        },
        { withCredentials: true }
      );
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="club-request-overlay" onClick={onClose}>
      <div className="club-request-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Request a new club</h3>
        <p className="club-request-sub">
          An admin (Head CR, Head GR or HOD) will approve or reject your
          request. You will become the club&apos;s first moderator if it is
          approved.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Club name (short, lowercase, e.g. robotics-club)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              placeholder="robotics-club"
            />
          </label>
          <label>
            Display title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Robotics Club"
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="What is this club about? Who should join?"
            />
          </label>
          {error && <p className="club-request-error">{error}</p>}
          <div className="club-request-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
