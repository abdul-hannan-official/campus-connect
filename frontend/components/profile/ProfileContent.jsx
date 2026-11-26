import { useState, useEffect } from "react";
import axios from "axios";
import EmptyState from "./EmptyState";
import CreatePostButton from "./CreatePostButton";
import SearchItem from "../../components/SearchItem/SearchItem";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function ProfileContent({
  activeTab = "Posts",
  user = null,
  isMyProfile = false,
}) {
  const [posts, setPosts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [saved,setSaved] = useState([])

  const onDeleteComment = (id) => {
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const onLeave = (name) => {
    setClubs((prev) => prev.filter((c) => c.name !== name));
  };

  const onDeletePost = async (id) => {
        try {
            await axios.delete(
          `${import.meta.env.VITE_API_URL}/posts/${id}`,
          { withCredentials: true },
        );
       setPosts((prev) => prev.filter((p) => p._id !== id));
      } catch (err) {
        console.error("Failed to delete post:", err);
      }

  };

  const onUnsavePost = async (id) => {
          try{await axios.patch(`${API_URL}/posts/unsave/${id}`,{}, {
            withCredentials: true})
          setSaved((prev) => prev.filter((p) => p._id !== id));
        }
          catch(err){
            console.log("Error while unsaving: ",err)
          }
  };

  // FETCH DATA
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        const [postsRes, clubsRes, commentsRes,savedRes] = await Promise.all([
          axios.get(`${API_URL}/posts/users/${user._id}`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/clubs/users/${user._id}`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/comments/users/${user._id}`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/posts/saved`, {
            withCredentials: true,
          })
        ]);

        setPosts(postsRes.data || []);
        setClubs(clubsRes.data || []);
        setComments(commentsRes.data || []);
        setSaved(savedRes.data||[]);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [user?._id]);

  const hasPosts = posts.length > 0;
  const hasClubs = clubs.length > 0;

  return (
    <div className="card profile-content">
      {activeTab === "Posts" && isMyProfile && <CreatePostButton />}

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      ) : (
        <div className="profile-items-container">
          {/* POSTS TAB */}
          {activeTab === "Posts" && (
            <>
              {hasPosts ? (
                posts.map((post) => (
                  <div key={post._id} className="profile-item-frame">
                    <SearchItem
                      type="post"
                      data={post}
                      onDelete={onDeletePost}
                      isNotSearch={true}
                      isMyProfile={isMyProfile}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title={"this user hasn't posted anything yet"}
                  message={
                    "Once this user post to a club the post will show up here!"
                  }
                ></EmptyState>
              )}
            </>
          )}

          {/* COMMUNITIES TAB */}
          {activeTab === "Clubs" && (
            <>
              {hasClubs ? (
                clubs.map((comm) => (
                  <div key={comm._id} className="profile-item-frame">
                    <SearchItem
                      type="club"
                      data={comm}
                      member={true}
                      onLeave={onLeave}
                      isNotSearch={true}
                      isMyProfile={isMyProfile}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title={"this user is nowhere to be found in any club"}
                  message={
                    "Join a club of this user's interests to dive into Campus Connect!"
                  }
                ></EmptyState>
              )}
            </>
          )}

          {/* COMMENTS TAB */}
          {activeTab === "Comments" && (
            <>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="profile-item-frame">
                    <SearchItem
                      type="comment"
                      data={comment}
                      onDelete={onDeleteComment}
                      isNotSearch={true}
                      isMyProfile={isMyProfile}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title={"this user has no comments yet"}
                  message={
                    "Maybe it's time to say this user's opinion out loud?"
                  }
                ></EmptyState>
              )}
            </>
          )}
          {/* SAVED TAB */}
          {activeTab === "Saved" && (
            <>
              {saved.length > 0 ? (
                saved.map((post) => (
                  <div key={post._id} className="profile-item-frame">
                    <SearchItem
                      type="post"
                      data={post}
                      onDelete={onUnsavePost}
                      isNotSearch={true}
                      isMyProfile={isMyProfile}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title={"You have no saves yet"}
                  message={
                    "Maybe your feed is too good you can't decide what to save?"
                  }
                ></EmptyState>
              )}
            </>
          )}

          {/* OTHER TABS */}
          {["Hidden", "Upvoted", "Downvoted"].includes(activeTab) && (
            <div className="empty-tab-message">Nothing here yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
