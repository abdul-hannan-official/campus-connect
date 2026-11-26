import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar.jsx";
import PostList from "../../components/Posts/PostList/PostList.jsx";
import "./SavedPage.css";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffMs = new Date() - date;
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// Bookmarked posts (User.savedPosts).
export default function SavedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/posts/saved`,
          { withCredentials: true }
        );
        const normalized = (Array.isArray(res.data) ? res.data : []).map((p) => ({
          id: p._id,
          _id: p._id,
          club: p.clubName || "",
          clubIcon: p.iconUrl || null,
          user: p.author || "",
          userAvatar: p.avatarUrl || "/profile.png",
          title: p.title || "",
          content: p.content || "",
          upvotes: p.upvoteCount || 0,
          downvotes: 0,
          voteCount: p.upvoteCount || 0,
          comments: p.commentCount || 0,
          time: formatTimeAgo(p.createdAt),
          userVote: 0,
          image: null,
          type: "text",
        }));
        setPosts(normalized);
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleVote = () => {
    // Voting from the saved page refreshes the list via PostPage; keep simple.
  };

  return (
    <div className="page-container">
      <LeftSidebar />
      <div className="feed-wrapper">
        <div className="main-feed">
          <h1 className="saved-title">Saved posts</h1>
          {loading ? (
            <p>Loading…</p>
          ) : posts.length === 0 ? (
            <div className="saved-empty">
              <p>You haven&apos;t saved any posts yet.</p>
              <button className="btn primary" onClick={() => navigate("/explore")}>
                Explore clubs
              </button>
            </div>
          ) : (
            <PostList posts={posts} viewMode="card" onVote={handleVote} />
          )}
        </div>
      </div>
    </div>
  );
}
