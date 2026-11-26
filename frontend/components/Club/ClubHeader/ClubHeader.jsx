import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClubHeader.css";

function ClubHeader({ club, isMember, setIsMember }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!club) return null;

  const baseUrl = import.meta.env.VITE_API_URL;

  const shownBanner = club?.bannerUrl
    ? `${baseUrl}${club.bannerUrl}`
    : ""; // or a default banner

  const shownIcon = club?.iconUrl ? `${baseUrl}${club.iconUrl}` : ""; // or a default icon

  const handleCreatePost = () => {
    navigate(`/create-post?club=${encodeURIComponent(club.name)}`);
  };

  const handleJoinToggle = async () => {
    try {
      setLoading(true);

      const url = isMember
        ? `${baseUrl}/clubs/${encodeURIComponent(club.name)}/leave`
        : `${baseUrl}/clubs/${encodeURIComponent(club.name)}/join`;

      const method = isMember ? "DELETE" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Action failed");
        return;
      }

      setIsMember(!isMember);
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clubHeader">
      <div className="bannerContainer">
        {shownBanner ? (
          <img src={shownBanner} alt="banner" className="banner" />
        ) : (
          <div className="banner bannerPlaceholder" />
        )}
      </div>

      <div className="info">
        {shownIcon ? (
          <img src={shownIcon} alt="icon" className="clubIcon" />
        ) : (
          <div className="clubIcon iconPlaceholder">r/</div>
        )}

        <div className="textInfo">
          <h1 className="name">r/{club.name}</h1>
          <p className="description">{club.description || ""}</p>
        </div>

        <div className="buttonGroup">
          {isMember &&(<button className="createPostBtn" onClick={handleCreatePost}>
            + Create Post
          </button>)}

          <button
            className="joinBtn"
            onClick={handleJoinToggle}
            disabled={loading}
          >
            {loading
              ? isMember
                ? "Leaving..."
                : "Joining..."
              : isMember
                ? "Joined"
                : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClubHeader;
