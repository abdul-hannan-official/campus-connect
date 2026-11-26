import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./OAuthButtons.css";

// Sign in / sign up with Google (Google Identity Services) or GitHub (OAuth).
// Google needs VITE_GOOGLE_CLIENT_ID in the frontend .env; the button is
// hidden with a note when it is not configured yet. GitHub needs the
// backend GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET set; the backend
// callback sets the session cookie and redirects back to the app.
export default function OAuthButtons({ onLogin }) {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [googleError, setGoogleError] = useState("");
  const [gisReady, setGisReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            await axios.post(
              `${apiUrl}/authentication/google`,
              // Backend googleAuth expects the ID token in the `token` field.
              { token: response.credential },
              { withCredentials: true }
            );
            onLogin();
            navigate("/");
          } catch (err) {
            setGoogleError(
              err.response?.data?.message || "Google sign-in failed"
            );
          }
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      }
      setGisReady(true);
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => setGoogleError("Could not load Google sign-in");
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleGitHub = () => {
    // Full-page redirect to the backend OAuth start; the callback sets the
    // session cookie and redirects back to the frontend.
    window.location.href = `${apiUrl}/authentication/github`;
  };

  return (
    <div className="oauth-buttons">
      <div className="oauth-divider">
        <span>or continue with</span>
      </div>

      {googleClientId ? (
        <div className="oauth-google">
          <div ref={googleBtnRef} />
          {!gisReady && !googleError && (
            <p className="oauth-note">Loading Google sign-in…</p>
          )}
        </div>
      ) : (
        <p className="oauth-note">
          Google sign-in is not configured yet (the owner needs to set
          VITE_GOOGLE_CLIENT_ID).
        </p>
      )}

      <button
        type="button"
        className="oauth-github-btn"
        onClick={handleGitHub}
      >
        <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        Continue with GitHub
      </button>

      {googleError && <p className="oauth-error">{googleError}</p>}
    </div>
  );
}
