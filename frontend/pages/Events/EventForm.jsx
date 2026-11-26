import { useState } from "react";
import axios from "axios";
import "./EventForm.css";

// Create / edit an event (admins, or moderators of the event's club).
export default function EventForm({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [category, setCategory] = useState(event?.category || "department");
  const [date, setDate] = useState(
    event?.date ? new Date(event.date).toISOString().slice(0, 10) : ""
  );
  const [time, setTime] = useState(event?.time || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { title, description, category, date, time, venue };
      if (isEdit) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/events/${event._id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/events`, payload, {
          withCredentials: true,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit Event" : "Create Event"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="competition">Competition</option>
              <option value="department">Department Event</option>
            </select>
          </label>
          <div className="event-form-row">
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label>
              Time
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:00 AM - 12:00 PM"
                required
              />
            </label>
          </div>
          <label>
            Venue
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="CS Department, Lab 1"
              required
            />
          </label>
          {error && <p className="event-form-error">{error}</p>}
          <div className="event-form-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
