import { useState } from "react";
import { createPortal } from "react-dom";
import {
  HiHome,
  HiFire,
  HiUserGroup,
  HiInformationCircle,
  HiSpeakerphone,
  HiCode,
  HiQuestionMarkCircle,
  HiNewspaper,
  HiBriefcase,
  HiBookOpen,
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

        <div className="nav-section">
          <h4>RESOURCES</h4>

          <a
            className="nav-item"
            href="https://github.com/adamt-eng/readit-reddit-clone"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiInformationCircle className="nav-icon" />
            <span>Readit — base project</span>
          </a>

          <a
            className="nav-item"
            href="https://www.reddit.com/advertising/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiSpeakerphone className="nav-icon" />
            <span>Advertise</span>
          </a>

          <a
            className="nav-item"
            href="https://www.reddit.com/dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiCode className="nav-icon" />
            <span>Developer Platform</span>
          </a>

          <a
            className="nav-item"
            href="https://www.reddithelp.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiQuestionMarkCircle className="nav-icon" />
            <span>Help</span>
          </a>

          <a
            className="nav-item"
            href="https://redditinc.com/blog/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiNewspaper className="nav-icon" />
            <span>Blog</span>
          </a>

          <a
            className="nav-item"
            href="https://redditinc.com/careers/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiBriefcase className="nav-icon" />
            <span>Careers</span>
          </a>

          <a
            className="nav-item"
            href="https://redditinc.com/press/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiBookOpen className="nav-icon" />
            <span>Press</span>
          </a>
        </div>
      </nav>
      {showCreateClub &&
        createPortal(
          <CreateClubModal onClose={() => setShowCreateClub(false)} />,
          document.body
        )}
    </div>
  );
}
