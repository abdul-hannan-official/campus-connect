import { useState, useEffect, useRef } from "react";
import LeftSidebar from "../../LeftSidebar/LeftSidebar";
import PostTabs from "../PostTabs/PostTabs";
import CreatePostForm from "../CreatePostForm/CreatePostForm";
import { useSearchParams } from "react-router-dom";

import "./CreatePost.css";

export default function CreatePost() {
  const [activeTab, setActiveTab] = useState("post");

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  // Read club from URL: /create-post?club=asuclub
  const [searchParams] = useSearchParams();
  const clubFromUrl = searchParams.get("club");

  // Fetch clubs user can post in (AUTH-BASED)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/posts/clubs`,
          { credentials: "include" },
        );

        if (!res.ok) {
          if (!cancelled) setClubs([]);
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          if (!cancelled) setClubs([]);
          return;
        }

        if (!cancelled) setClubs(data);

        // auto-select club if coming from URL
        if (clubFromUrl) {
          const match = data.find(
            (c) => c.name?.toLowerCase() === clubFromUrl.toLowerCase(),
          );
          if (!cancelled) setSelectedClub(match || null);
        }
      } catch (err) {
        console.error("Failed to fetch clubs", err);
        if (!cancelled) setClubs([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubFromUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Render
  return (
    <div className={"createpost-page-wrapper"}>
      <LeftSidebar />

      <div className="createpost-page">
        <div className="create-post-wrapper">
          <div className="create-post-container">
            {/* Header */}
            <div className="create-post-header">
              <div className="create-post-title">Create post</div>
            </div>

            {/* Club Selector */}
            <div className="create-post-controls" ref={dropdownRef}>
              <button
                className="club-selector"
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <img
                  className="club-avatar"
                  src={
                    selectedClub?.iconUrl
                      ? `${import.meta.env.VITE_API_URL}${selectedClub.iconUrl}`
                      : "/assets/reddit-logo.png"
                  }
                  alt={selectedClub?.name || "club"}
                />

                <span className="club-selector-text">
                  {selectedClub
                    ? selectedClub.name
                    : "Select a club"}
                </span>
                <span
                  className={`dropdown-arrow ${showDropdown ? "open" : ""}`}
                >
                  ▾
                </span>
              </button>

              {showDropdown && (
                <div className="club-dropdown">
                  {clubs.length === 0 && (
                    <div className="club-empty">
                      No clubs available
                    </div>
                  )}

                  {clubs.map((c) => {
                    const isSelected = selectedClub?._id === c._id;

                    return (
                      <div
                        key={c._id}
                        className={`club-option ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedClub(c);
                          setShowDropdown(false);
                        }}
                      >
                        <img
                          className="club-avatar small"
                          src={
                            c.iconUrl
                              ? `${import.meta.env.VITE_API_URL}${c.iconUrl}`
                              : "/assets/default-club.png"
                          }
                          alt={c.name}
                        />

                        <div className="club-text">
                          <div className="club-name">{c.name}</div>
                          {c.title && (
                            <div className="club-title">{c.title}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabs */}
            <PostTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Tab content */}
            <CreatePostForm
              type={activeTab}
              selectedClub={selectedClub}
            />
          </div>
        </div>

        <aside className="createpost-aside" />
      </div>
    </div>
  );
}
