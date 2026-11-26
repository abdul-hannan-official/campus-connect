import { FaArrowUp, FaRegCommentAlt } from "react-icons/fa";
import InitialAvatar, { stripRedditPrefix } from "../../Avatar/InitialAvatar.jsx";
import "./RecentPosts.css";

const RecentPosts = ({
  recentPosts,
  onClearRecentPosts,
  onPostClick,
  onClubClick,
  formatRelativeTime,
  formatNumber,
}) => {
  // Return null when there are no recent posts
  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  // Handle club click
  const handleClubClick = (e, clubName) => {
    e.stopPropagation(); // Prevent post click
    if (onClubClick) {
      onClubClick(clubName);
    }
  };

  return (
    <div className="recent-posts-box">
      <div className="recent-posts-header">
        <h3>RECENT POSTS</h3>
        <button
          className="clear-recent-btn"
          onClick={onClearRecentPosts}
          title="Clear all recent posts"
        >
          Clear
        </button>
      </div>

      <div className="recent-posts-list">
        {recentPosts.map((post) => (
          <div
            key={post.id}
            className="recent-post-item"
            onClick={() => onPostClick && onPostClick(post.id)}
          >
            <div className="recent-post-content">
              <div className="recent-post-header">
                <InitialAvatar
                  name={post.club || post.user}
                  iconUrl={
                    post.clubIcon
                      ? `${import.meta.env.VITE_API_URL}${post.clubIcon}`
                      : null
                  }
                  size={20}
                  className="recent-post-user-avatar"
                />
                <span
                  className="recent-post-club"
                  onClick={(e) => handleClubClick(e, post.club)}
                  style={{ cursor: 'pointer' }}
                >
                  {post.club ? stripRedditPrefix(post.club) : stripRedditPrefix(post.user)}
                </span>
                <span className="recent-post-divider">•</span>
                <span className="recent-post-time">
                  {formatRelativeTime
                    ? formatRelativeTime(post.time)
                    : post.time}
                </span>
              </div>

              <div className="recent-post-title">{post.title}</div>
              <div className="recent-post-stats">
                <div className="recent-post-stat">
                  <FaArrowUp className="icon" />
                  <span>
                    {formatNumber ? formatNumber(post.upvotes) : post.upvotes}
                  </span>
                </div>
                <div className="recent-post-stat">
                  <FaRegCommentAlt className="icon" />
                  <span>
                    {formatNumber ? formatNumber(post.comments) : post.comments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentPosts;