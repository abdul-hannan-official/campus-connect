import {
  FaRegCommentAlt,
  FaShare,
  FaEllipsisH,
  FaExpand,
  FaCompress,
  FaBell,
  FaRegBookmark,
  FaEyeSlash,
  FaFlag,
  FaThumbtack,
  FaLink,
  FaPaperclip,
} from "react-icons/fa";
import InitialAvatar, { stripRedditPrefix } from "../../Avatar/InitialAvatar.jsx";
import "./PostCard.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Vote from "../../Vote/Vote.jsx";
import ReportDialog from "../../Moderation/ReportDialog.jsx";
import axios from "axios";

export default function PostCard({
  // Post data
  post,
  viewMode,

  // Functionality props
  onVote,
  formatNumber,
  onJoinClub,
  showJoin,
  joinedClubs = [],
  onHidePost,
  getThumbnailImage,
  toggleExpand,

  // Guest-specific
  isGuest = false,
  onPromptLogin,

  // Moderation (passed by ClubPage when the viewer moderates this club;
  // both prop names are accepted — PostList passes isModerator)
  canModerate = false,
  isModerator = false,
  onPinPost,
  onRemovePost,
}) {
  const canModerateClub = canModerate || isModerator;
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.post-menu-wrapper')) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Use the provided function or create a default
  const getThumbnail =
    getThumbnailImage ||
    ((post) => {
      if (post.image) return `${import.meta.env.VITE_API_URL}${post.image}`;
      return "../../../assets/compact-image.png";
    });

  const handleUpvote = () => {
    if (isGuest) {
      onPromptLogin?.();
    } else {
      onVote?.(post.id, 1);
    }
  };

  const handleDownvote = () => {
    if (isGuest) {
      onPromptLogin?.();
    } else {
      onVote?.(post.id, -1);
    }
  };

  const handleJoinClub = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isGuest) {
      onPromptLogin?.();
      return;
    }

    const clubName =
      typeof post.club === "string"
        ? post.club
        : post.club?.name;

    if (!clubName) {
      console.error("Invalid club:", post.club);
      return;
    }

    onJoinClub?.(clubName);
  };
  
  const handleSharePost = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url);
    alert("Post link copied to clipboard");
  };

  const handleHidePost = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    
    if (isGuest) {
      onPromptLogin?.();
    } else {
      onHidePost?.(post.id, e);
    }
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };


const handleSavePost = async () => {
    if (isGuest) {
      onPromptLogin?.();
    } else {
      try{
      await axios.patch(`${import.meta.env.VITE_API_URL}/posts/save/${post.id}`,{},{withCredentials:true})}
      catch(err){
        console.log("error while saving ",err)
      }
    }
};
  

  const handleMenuAction = async (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    
    if (action === 'hide') {
      handleHidePost(e);
    } else if (action === 'report') {
      setShowReport(true);
    } else if (action === 'save') {
      handleSavePost();
    } else if (action === 'follow') {
      console.log('Follow post:', post.id);
      // Add follow logic here
    } else if (action === 'pin') {
      // Second arg is the CURRENT pinned state; the handler picks
      // "unpin" when currently pinned, "pin" otherwise.
      onPinPost?.(post.id, !!post.pinned);
    } else if (action === 'remove') {
      if (window.confirm("Remove this post? It will be hidden from the club.")) {
        onRemovePost?.(post.id);
      }
    }
  };

  return (
    <div className={`post-card ${viewMode}-view`}>
      {/* Thumbnail for compact view - only show when NOT expanded AND has image */}
      {viewMode === "compact" && !post.isExpanded && post.image && (
        <Link to={`/posts/${post.id}`} className="post-thumbnail">
          <img
            src={getThumbnail(post)}
            alt={post.title}
            className="thumbnail-image"
          />
        </Link>
      )}

      {/* When expanded in compact view, add a class for spacing - only if has image */}
      {viewMode === "compact" && post.isExpanded && post.image && (
        <div className="post-thumbnail-placeholder"></div>
      )}

      <div className="post-content">
        {/* EXPAND BUTTON for compact view - NOT wrapped in Link */}
        {viewMode === "compact" && (post.image || post.content) && (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand?.(post.id);
            }}
            title={post.isExpanded ? "Collapse" : "Expand"}
          >
            {post.isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
        )}

        <div className="post-meta">
          <Link
            onClick={(e) => e.stopPropagation()}
            to={`/club/${post.club}`}
            className="post-meta-left"
          >
            <InitialAvatar
              name={post.club || post.user}
              iconUrl={
                post.clubIcon
                  ? `${import.meta.env.VITE_API_URL}${post.clubIcon}`
                  : null
              }
              size={32}
              className="club-icon"
            />
            {post.club ? (
              <>
                <span className="club">{stripRedditPrefix(post.club)}</span>
                <span className="divider">•</span>
              </>
            ) : (
              <>
                <span className="club">{stripRedditPrefix(post.user)}</span>
                <span className="divider">•</span>
              </>
            )}
            <span className="user">Posted by {stripRedditPrefix(post.user)}</span>
            <span className="divider">•</span>
            <span className="time">{post.time}</span>
          </Link>

          <div className="post-meta-right">
            {/* Join button only shows if post has a club AND is NOT user's own post */}
            {!isGuest &&
              post.club &&
              !post.isUserPost &&
              (Array.isArray(joinedClubs)
                ? !joinedClubs.includes(post.club)
                : true) && showJoin && (
                <button
                  className={`join-btn joined`}
                  onClick={handleJoinClub}
                >
                  Join
                </button>
              )}

            <div
              className="post-menu-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="post-menu-btn"
                onClick={toggleMenu}
              >
                <FaEllipsisH />
              </button>

              {showMenu && (
                <div 
                  className="post-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Different menu for guests vs logged-in users */}
                  {isGuest ? (
                    // Guest menu - only Report button
                    <button
                      className="menu-item flag-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(false);
                        onPromptLogin?.();
                      }}
                    >
                      <FaFlag className="menu-icon" />
                      Report
                    </button>
                  ) : post.club ? (
                    <>
                      <button 
                        className="menu-item"
                        onClick={(e) => handleMenuAction(e, 'follow')}
                      >
                        <FaBell className="menu-icon" />
                        Follow Post
                      </button>
                      <button 
                        className="menu-item"
                        onClick={(e) => handleMenuAction(e, 'save')}
                      >
                        <FaRegBookmark className="menu-icon" />
                        Save
                      </button>
                      <button 
                        className="menu-item" 
                        onClick={(e) => handleMenuAction(e, 'hide')}
                      >
                        <FaEyeSlash className="menu-icon" />
                        Hide
                      </button>
                      <hr className="menu-divider" />
                      <button 
                        className="menu-item flag-item"
                        onClick={(e) => handleMenuAction(e, 'report')}
                      >
                        <FaFlag className="menu-icon" />
                        Report
                      </button>
                      {canModerateClub && (
                        <>
                          <hr className="menu-divider" />
                          <button
                            className="menu-item"
                            onClick={(e) => handleMenuAction(e, 'pin')}
                          >
                            <FaThumbtack className="menu-icon" /> {post.pinned ? "Unpin post" : "Pin post"}
                          </button>
                          <button
                            className="menu-item flag-item"
                            onClick={(e) => handleMenuAction(e, 'remove')}
                          >
                            <FaEyeSlash className="menu-icon" />
                            Remove post
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    /* Minimal menu for user posts (no club) */
                    <>
                      <button 
                        className="menu-item" 
                        onClick={(e) => handleMenuAction(e, 'hide')}
                      >
                        <FaEyeSlash className="menu-icon" />
                        Hide
                      </button>
                      <button 
                        className="menu-item flag-item"
                        onClick={(e) => handleMenuAction(e, 'report')}
                      >
                        <FaFlag className="menu-icon" />
                        Report
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title wrapped in Link */}
        <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="post-title">
            {post.pinned && (
              <span className="pinned-badge">
                <FaThumbtack /> Pinned
              </span>
            )}{" "}
            {post.title}
          </h3>
        </Link>

        {/* Link post */}
        {post.type === "link" && post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="post-link"
            onClick={(e) => e.stopPropagation()}
          >
            <FaLink className="post-link-icon" /> {post.linkUrl}
          </a>
        )}

        {/* Document attachments */}
        {Array.isArray(post.attachments) && post.attachments.length > 0 && (
          <div className="post-attachments">
            {post.attachments.map((url) => (
              <a
                key={url}
                href={`${import.meta.env.VITE_API_URL}${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="post-attachment"
                onClick={(e) => e.stopPropagation()}
              >
                <FaPaperclip className="post-link-icon" /> {decodeURIComponent(url.split("/").pop())}
              </a>
            ))}
          </div>
        )}

        {/* EXPANDED CONTENT for compact view */}
        {viewMode === "compact" && post.isExpanded && (
          <div className="expanded-content">
            {post.image && (
              <img
                src={`${import.meta.env.VITE_API_URL}${post.image}`}
                alt={post.title}
                className="expanded-image"
              />
            )}
            {post.content && (
              <div className="expanded-text">{post.content}</div>
            )}
          </div>
        )}

        {/* Full content and image for card view */}
        {viewMode === "card" && !post.isExpanded && (
          <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
            {post.content && <div className="post-body">{post.content}</div>}
            {post.image && (
              <div className="post-image-container">
                <img
                  src={`${import.meta.env.VITE_API_URL}${post.image}`}
                  alt={post.title}
                  className="post-image"
                />
              </div>
            )}
          </Link>
        )}

        <div
          className="post-actions-bar"
          onClick={(e) => e.stopPropagation()}
        >
          <Vote
            voteCount={formatNumber?.(post.voteCount) || post.voteCount}
            userVote={post.userVote}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
            orientation="horizontal"
            itemId={post.id}
          />

          {/* Comment Button - wrapped in Link */}
          <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
            <button className="post-action-btn comment-btn">
              <FaRegCommentAlt className="action-icon" />
              <span className="action-text">
                {formatNumber?.(post.comments) || post.comments} Comments
              </span>
            </button>
          </Link>

          <button
            onClick={(e) => {
              if (isGuest) {
                e.stopPropagation();
                onPromptLogin?.();
              } else {
                handleSharePost(e);
              }
            }}
            className="post-action-btn"
          >
            <FaShare className="action-icon" />
            <span className="action-text">Share</span>
          </button>
        </div>
      </div>

      {showReport && (
        <ReportDialog
          postId={post.id}
          onClose={() => setShowReport(false)}
          onReported={() => alert("Report submitted. Moderators will review it.")}
        />
      )}
    </div>
  );
}