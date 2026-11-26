import { useState } from "react";
import InitialAvatar, { stripRedditPrefix } from "../../Avatar/InitialAvatar.jsx";
import "./PopularClubs.css";

const PopularClubs = ({ clubs }) => {
  const [showAll, setShowAll] = useState(false);

  // Show only first 3 clubs by default, show all when "See More" is clicked
  const displayedClubs = showAll ? clubs : clubs.slice(0, 3);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className={"popular-clubs"}>
      <div className="clubs-header">
        <h3>Popular Clubs</h3>
      </div>
      <div className="clubs-list">
        {displayedClubs.map((club, index) => (
          <div key={index} className="club-item">
            <InitialAvatar
              name={club.name}
              iconUrl={club.avatar}
              size={32}
              className="club-avatar"
            />
            <div className="club-info">
              <span className="club-name">{stripRedditPrefix(club.name)}</span>
              <span className="club-members">
                {club.members} members
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* See More Button */}
      {clubs.length > 3 && (
        <div className="clubs-footer">
          <button className="see-more-btn" onClick={toggleShowAll}>
            {showAll ? "See Less" : "See More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PopularClubs;
