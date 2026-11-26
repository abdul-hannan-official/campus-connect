import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import InitialAvatar, { stripRedditPrefix } from "../Avatar/InitialAvatar.jsx";

import axios from "axios";

import "./SearchItem.css";

function formatTimeAgo(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

export default function SearchItem({
  type,
  data,
  member = false,
  onLeave = null,
  onDelete = null,
  isNotSearch = false,
  isMyProfile = false,
}) {
  const [isMember, setIsMember] = useState(member);

  /* ===============================
     CLUB
  =============================== */
  if (type === "club") {
    const handleMembership = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (isMember) {
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/clubs/${encodeURIComponent(
              data.name
            )}/leave`,
            { withCredentials: true }
          );
          setIsMember(false);
          data.memberCount = (data.memberCount || 1) - 1;
          if (onLeave) onLeave(data.name);
        } else {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/clubs/${data.name}/join`,
            {},
            { withCredentials: true }
          );
          setIsMember(true);
          data.memberCount = (data.memberCount || 1) + 1;
        }
      } catch (err) {
        console.log("Failed to join/leave club ", err);
      }
    };

    return (
      <Link to={`/club/${data.name}`} className="sc-container">
        <InitialAvatar
          name={data.name}
          iconUrl={
            data.iconUrl ? `${import.meta.env.VITE_API_URL}${data.iconUrl}` : null
          }
          size={40}
          className="sc-icon"
        />

        <div className="sc-info">
          <div className="sc-title">
            {stripRedditPrefix(data.name)}
          </div>
          <div className="sc-members">
            {(data.memberCount ?? 0).toLocaleString()} members
          </div>
        </div>

        {isNotSearch && isMyProfile && (
          <button
            className={`sc-join-btn ${isMember ? "leave" : "join"}`}
            onClick={handleMembership}
          >
            {isMember ? "Leave" : "Join"}
          </button>
        )}
      </Link>
    );
  }

  /* ===============================
     POST
  =============================== */
  if (type === "post") {
    const timeAgo = formatTimeAgo(data.createdAt);
    const [slidingOut, setSlidingOut] = useState(false);
    const ref = useRef(null);
    const SLIDE_DURATION_MS = 360;

    const handleDelete = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (slidingOut) return;

      setSlidingOut(true);

      setTimeout(() => {
        onDelete && onDelete(data._id);
      }, SLIDE_DURATION_MS);
    };

    return (
      <Link
        ref={ref}
        to={`/posts/${data._id}`}
        className={[
          "sp-container",
          slidingOut ? "sp-slide-out" : "",
        ].join(" ")}
      >
        <div className="sp-left">
          <div className="sp-meta">
            <InitialAvatar
              name={data.clubName}
              iconUrl={
                data?.iconUrl
                  ? `${import.meta.env.VITE_API_URL}${data.iconUrl}`
                  : null
              }
              size={20}
              className="sp-icon"
            />
            <span className="sp-club">
              {stripRedditPrefix(data.clubName)}
            </span>
            <span className="sp-time">• {timeAgo}</span>
          </div>

          <div className="sp-title">{data.title}</div>

          <div className="sp-sub">
            {(data.upvoteCount ?? 0).toLocaleString()} votes •{" "}
            {(data.commentCount ?? 0).toLocaleString()} comments
          </div>
        </div>

        {onDelete && isMyProfile && (
          <FaTrash className="sp-delete-btn" onClick={handleDelete} />
        )}

        {data.media?.url && (
          <img className="sp-thumb" src={data.media.url} alt="" />
        )}
      </Link>
    );
  }

  /* ===============================
     USER
  =============================== */
  if (type === "user") {
    return (
      <Link to={`/user/${data._id}`} className="su-container">
        <InitialAvatar
          name={data.username}
          iconUrl={
            data?.avatarUrl
              ? `${import.meta.env.VITE_API_URL}${data.avatarUrl}`
              : null
          }
          size={40}
          className="su-avatar"
        />

        <div>
          <div className="su-name">{data.username}</div>
          <div className="su-handle">@{data.username}</div>
        </div>
      </Link>
    );
  }

  /* ===============================
     COMMENT
  =============================== */
  if (type === "comment") {
    const timeAgo = formatTimeAgo(data.createdAt);
    const [slidingOut, setSlidingOut] = useState(false);
    const ref = useRef(null);
    const SLIDE_DURATION_MS = 360;

    const handleDelete = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (slidingOut) return;

      setSlidingOut(true);

      setTimeout(async () => {
        try {
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/comments/${data._id}`,
            { withCredentials: true }
          );
          onDelete && onDelete(data._id);
        } catch (err) {
          console.error("Failed to delete comment:", err);
        }
      }, SLIDE_DURATION_MS);
    };

    return (
      <Link
        ref={ref}
        to={`/posts/${data.postId}`}
        className={[
          "sp-container",
          slidingOut ? "sp-slide-out" : "",
        ].join(" ")}
      >
        <div className="sp-left">
          <div className="sp-meta">
            <InitialAvatar
              name={data.clubName}
              iconUrl={
                data?.iconUrl
                  ? `${import.meta.env.VITE_API_URL}${data.iconUrl}`
                  : null
              }
              size={20}
              className="sp-icon"
            />
            <span className="sp-club">
              {stripRedditPrefix(data.clubName)}
            </span>
            <span className="sp-time">• {timeAgo}</span>
          </div>

          <div className="sp-title">{data.content}</div>
        </div>

        {onDelete && isMyProfile && (
          <FaTrash className="sp-delete-btn" onClick={handleDelete} />
        )}
      </Link>
    );
  }

  return null;
}
