import { FaUsers, FaCalendarAlt, FaBullhorn } from "react-icons/fa";
import logo from "../../assets/logo.png";

// Green side panel for the full Login / Signup pages (not shown in the modal).
export default function AuthSidePanel() {
  return (
    <div className="auth-left">
      <div className="auth-panel-brand">
        <img src={logo} alt="Campus Connect" className="auth-panel-logo" />
        <span className="auth-panel-wordmark">
          Campus<span className="brand-green">Connect</span>
        </span>
      </div>

      <div className="auth-panel-body">
        <p className="auth-panel-eyebrow">CS Department Community</p>
        <h2>Every club, event and announcement — in one place.</h2>
        <ul className="auth-panel-points">
          <li>
            <FaUsers /> Join clubs across the CS department
          </li>
          <li>
            <FaCalendarAlt /> Never miss a department event
          </li>
          <li>
            <FaBullhorn /> Official announcements, on time
          </li>
        </ul>
      </div>

      <p className="auth-panel-foot">Campus Connect © 2026</p>
    </div>
  );
}
