import { useState } from "react";
import { createPortal } from "react-dom";
import {
  HiHome,
  HiFire,
  HiUserGroup,
  HiPlus,
} from "react-icons/hi";
import { NavLink } from "react-router-dom";
import CreateClubModal from "../Club/CreateClubModal/CreateClubModal";
import "./LeftSidebar.css";

export default function LeftSidebar({
  showStartClub = true,
}) {
  const [showCreateClub, setShowCreateClub] = useState(false);

  const handleStartClubClick = () => {
    setShowCreateClub(true);
  };

  return (
    <div className="left-sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <HiHome className="nav-icon" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/popular"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <HiFire className="nav-icon" />
            <span>Popular</span>
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <HiUserGroup className="nav-icon" />
            <span>Explore Clubs</span>
          </NavLink>
        </div>

        {showStartClub && (
          <div className="nav-section">
            <h4>CREATE</h4>
            <button
              className="start-club-btn"
              onClick={handleStartClubClick}
            >
              <HiPlus className="nav-icon" />
              <span>Start a club</span>
            </button>
          </div>
        )}

      </nav>
      {showCreateClub &&
        createPortal(
          <CreateClubModal onClose={() => setShowCreateClub(false)} />,
          document.body
        )}
    </div>
  );
}
