import { useState } from "react";
import { createPortal } from "react-dom";
import {
  HiHome,
  HiFire,
  HiUserGroup,
  HiPlus,
  HiCalendar,
  HiSpeakerphone,
  HiBookmark,
  HiBell,
  HiCog,
} from "react-icons/hi";
import { NavLink, useLocation } from "react-router-dom";
import CreateClubModal from "../Club/CreateClubModal/CreateClubModal";
import logo from "../../assets/logo.png";
import "./LeftSidebar.css";

const MENU_ITEMS = [
  { to: "/", end: true, icon: HiHome, label: "Home" },
  { to: "/popular", icon: HiFire, label: "Popular" },
  { to: "/explore", icon: HiUserGroup, label: "Explore Clubs" },
  { to: "/events", icon: HiCalendar, label: "Events" },
  { to: { pathname: "/", hash: "#announcements" }, hash: "#announcements", icon: HiSpeakerphone, label: "Announcements" },
  { to: "/saved", icon: HiBookmark, label: "Saved" },
  { to: "/notifications", icon: HiBell, label: "Notifications" },
];

export default function LeftSidebar({
  showStartClub = true,
}) {
  const [showCreateClub, setShowCreateClub] = useState(false);
  const location = useLocation();

  const handleStartClubClick = () => {
    setShowCreateClub(true);
  };

  return (
    <div className="left-sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h4>Menu</h4>
          {MENU_ITEMS.map(({ to, end, hash, icon: Icon, label }) => {
            const path = typeof to === "string" ? to : to.pathname;
            // Active state is computed here, not NavLink's built-in one:
            // it ignores the hash, so Home ("/", end) would stay
            // highlighted while scrolled to Announcements. Exactly one
            // item is active at a time.
            const isActive = hash
              ? location.hash === hash
              : end
                ? location.pathname === path && !location.hash
                : location.pathname === path ||
                  location.pathname.startsWith(path + "/");
            return (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={() => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="nav-icon" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>

        {showStartClub && (
          <div className="nav-section">
            <h4>Create</h4>
            <button
              className="start-club-btn"
              onClick={handleStartClubClick}
            >
              <HiPlus className="nav-icon" />
              <span>Start a club</span>
            </button>
          </div>
        )}

        <div className="nav-section">
          <h4>General</h4>
          <NavLink
            to="/edit-profile"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <HiCog className="nav-icon" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-promo">
        <img src={logo} alt="Campus Connect" className="sidebar-promo-logo" />
        <strong>Get the CampusConnect app</strong>
        <p>Clubs, events and announcements — all in one place.</p>
      </div>

      {showCreateClub &&
        createPortal(
          <CreateClubModal onClose={() => setShowCreateClub(false)} />,
          document.body
        )}
    </div>
  );
}
