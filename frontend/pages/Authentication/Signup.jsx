import "./Auth.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import OAuthButtons from "../../components/Authentication/OAuthButtons.jsx";
import AuthSidePanel from "../../components/Authentication/AuthSidePanel.jsx";

export default function Signup({ onLogin, onSignup, inModal, switchMode }) {
  // routes.jsx passes onLogin; accept onSignup too so a prop-name mismatch
  // can never again turn a successful signup into "Signup failed".
  const handleAuthDone = onLogin || onSignup;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [postSignupHint, setPostSignupHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSuccess("");
    setPostSignupHint("");
    setIsSubmitting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/authentication/signup`,
        { email, username, password },
        { withCredentials: true }
      );

      setSuccess("Account created successfully");
      setPostSignupHint(
        "To continue setting up your profile, please go to My Profile > Edit Profile"
      );

      // Hide the hint after 2 seconds
      setTimeout(() => {
        setPostSignupHint("");
      }, 2000);

      // Refresh the logged-in user. A failure here must NOT report the
      // signup itself as failed — the account already exists at this point.
      try {
        if (handleAuthDone) await handleAuthDone();
      } catch (err) {
        console.error("Post-signup session refresh failed:", err);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`auth-page signup-page ${
        inModal ? "auth-modal-content" : ""
      }`}
    >
      {!inModal && <AuthSidePanel />}

      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Create Account</h1>
          <p>Join your CS department community</p>

          {error && <div className="auth-alert auth-error">{error}</div>}
          {success && <div className="auth-alert auth-success">{success}</div>}

          {postSignupHint && (
            <div className="auth-alert auth-success">
              {postSignupHint}
            </div>
          )}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Sign Up"}
          </button>

          <OAuthButtons onLogin={handleAuthDone} />

          <p className="auth-small">
            Already have an account?{" "}
            {inModal ? (
              <button
                type="button"
                className="auth-link-switch"
                onClick={switchMode}
              >
                Log in
              </button>
            ) : (
              <a href="/login">Log in</a>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}