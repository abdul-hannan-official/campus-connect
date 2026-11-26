import "./Auth.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import OAuthButtons from "../../components/Authentication/OAuthButtons.jsx";
import AuthSidePanel from "../../components/Authentication/AuthSidePanel.jsx";

export default function Login({ onLogin, inModal, switchMode }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Logging in..");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/authentication/login`,
        { email, password },
        { withCredentials: true },
      );
      onLogin();

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className={`auth-page login-page  ${inModal ? "auth-modal-content" : ""}`}
    >
      {!inModal && <AuthSidePanel />}

      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Welcome Back</h1>
          <p>Log in to your Campus Connect account</p>

          {error && <p className="auth-error">{error}</p>}

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
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit">
            Log In
          </button>

          <OAuthButtons onLogin={onLogin} />

          <p className="auth-small">
            New to Campus Connect?{" "}
            {inModal ? (
              <button
                type="button"
                className="auth-link-switch"
                onClick={switchMode}
              >
                Sign up
              </button>
            ) : (
              <a href="/signup">Sign up</a>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}