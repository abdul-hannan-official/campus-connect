import { useEffect, useState } from "react";
import {
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUniversity,
} from "react-icons/fa";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./EventsPage.css";
import EventForm from "./EventForm.jsx";

const CATEGORY_LABELS = {
  workshop: "Workshop",
  seminar: "Seminar",
  competition: "Competition",
  department: "Department Event",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function EventsPage({ currentUser }) {
  const [filter, setFilter] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const isAdmin = currentUser?.role === "admin";

  const fetchEvents = async (f = filter) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/events`,
        { params: { filter: f }, withCredentials: true }
      );
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRegister = async (event) => {
    try {
      if (event.isRegistered) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/events/${event._id}/register`,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/events/${event._id}/register`,
          {},
          { withCredentials: true }
        );
      }
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleCancel = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"? It will stay visible as a cancelled event.`)) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/events/${event._id}/cancel`,
        {},
        { withCredentials: true }
      );
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel event");
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}" permanently?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/events/${event._id}`, {
        withCredentials: true,
      });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const calendarEvents = events.map((e) => ({
    id: e._id,
    title: e.title,
    start: e.date,
    backgroundColor: e.status === "cancelled" ? "#c0392b" : "#0e7a4d",
    borderColor: e.status === "cancelled" ? "#c0392b" : "#0e7a4d",
    extendedProps: e,
  }));

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Department Events</h1>
        {isAdmin && (
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <FaPlus /> Create Event
          </button>
        )}
      </div>

      <div className="events-filters">
        {["upcoming", "past", "all"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "upcoming" ? "Upcoming" : f === "past" ? "Past" : "All"}
          </button>
        ))}
      </div>

      {error && <p className="events-error">{error}</p>}

      <div className="events-calendar">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={({ event }) => setSelected(event.extendedProps)}
          height="auto"
        />
      </div>

      {loading ? (
        <p>Loading events…</p>
      ) : events.length === 0 ? (
        <p className="events-empty">
          No {filter === "all" ? "" : filter} events yet.
          {isAdmin && " Create the first one with the button above."}
        </p>
      ) : (
        <div className="events-list">
          {events.map((e) => (
            <article key={e._id} className="event-card">
              <div className="event-card-head">
                <span className="event-category">
                  {CATEGORY_LABELS[e.category] || e.category}
                </span>
                {e.status === "cancelled" && (
                  <span className="event-cancelled">Cancelled</span>
                )}
                <span className="event-date">
                  <FaCalendarAlt /> {formatDate(e.date)}
                </span>
              </div>
              <h3 className="event-title">{e.title}</h3>
              <p className="event-desc">{e.description}</p>
              <p className="event-meta">
                <FaClock /> {e.time} &nbsp;·&nbsp; <FaMapMarkerAlt /> {e.venue}
                {e.club ? (
                  <>
                    {" "}
                    · <FaUniversity /> {e.club.name}
                  </>
                ) : (
                  ""
                )}
              </p>
              <p className="event-meta">
                Organised by {e.organizer?.username || "Admin"} ·{" "}
                {e.registeredCount || 0} registered
              </p>
              <div className="event-actions">
                {e.status === "scheduled" && (
                  <button
                    className={`btn ${e.isRegistered ? "secondary" : "primary"}`}
                    onClick={() => handleRegister(e)}
                  >
                    {e.isRegistered ? "Unregister" : "Register"}
                  </button>
                )}
                <button className="btn secondary" onClick={() => setSelected(e)}>
                  Details
                </button>
                {isAdmin && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setEditing(e);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    {e.status === "scheduled" && (
                      <button className="btn danger" onClick={() => handleCancel(e)}>
                        Cancel
                      </button>
                    )}
                    <button className="btn danger" onClick={() => handleDelete(e)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchEvents();
          }}
        />
      )}

      {selected && (
        <div className="event-modal-overlay" onClick={() => setSelected(null)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selected.title}</h2>
            <p className="event-meta">
              {CATEGORY_LABELS[selected.category] || selected.category} ·{" "}
              {formatDate(selected.date)} · {selected.time}
            </p>
            <p className="event-meta">
              <FaMapMarkerAlt /> {selected.venue}
            </p>
            <p>{selected.description}</p>
            <p className="event-meta">
              Status: {selected.status} · {selected.registeredCount || 0}{" "}
              registered
            </p>
            <div className="event-actions">
              {selected.status === "scheduled" && (
                <button
                  className="btn primary"
                  onClick={() => {
                    handleRegister(selected);
                    setSelected(null);
                  }}
                >
                  {selected.isRegistered ? "Unregister" : "Register"}
                </button>
              )}
              <button className="btn secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
