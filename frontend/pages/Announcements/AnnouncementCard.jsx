import "./AnnouncementCard.css";
import { FaCalendarAlt, FaLink, FaPaperclip } from "react-icons/fa";
import { resolveMediaUrl } from "../../src/utils/mediaUrl.js";

// One official departmental announcement.
// Shows the publication date/time (createdAt), the category, an optional
// link and any attached documents. Admins also get a Delete button.
export default function AnnouncementCard({ announcement, canDelete, onDelete }) {
  const published = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleString()
    : "";

  return (
    <article className="announcement-card">
      <div className="announcement-head">
        <span className="announcement-category">{announcement.category}</span>
        {announcement.club && (
          <span className="announcement-club">{announcement.club.name}</span>
        )}
        <span className="announcement-date" title="Published">
          <FaCalendarAlt /> {published}
        </span>
      </div>

      {announcement.title && (
        <h3 className="announcement-title">{announcement.title}</h3>
      )}
      <p className="announcement-content">{announcement.content}</p>

      {announcement.link && (
        <a
          href={announcement.link}
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-link"
        >
          <FaLink /> {announcement.link}
        </a>
      )}

      {Array.isArray(announcement.attachments) &&
        announcement.attachments.length > 0 && (
          <div className="announcement-attachments">
            {announcement.attachments.map((url) => (
              <a
                key={url}
                href={resolveMediaUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="announcement-attachment"
              >
                <FaPaperclip /> {decodeURIComponent(url.split("/").pop())}
              </a>
            ))}
          </div>
        )}

      <div className="announcement-foot">
        <span className="announcement-sender">
          By {announcement.sender?.username || "Admin"}
          {announcement.sender?.adminTitle
            ? ` (${announcement.sender.adminTitle})`
            : ""}
        </span>
        {canDelete && (
          <button
            className="announcement-delete"
            onClick={() => onDelete?.(announcement._id)}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
