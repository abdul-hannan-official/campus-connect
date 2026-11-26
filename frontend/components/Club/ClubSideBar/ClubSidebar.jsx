import { useState } from "react";
import "./ClubSidebar.css";
import EditClubModal from "../EditClubModal/EditClubModal";

function ClubSidebar({
  club,
  isMember,
  setIsMember,
  isModerator,
  onClubUpdated,
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!club) return null;

  const handleLeave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/clubs/${club.name}/leave`,
        { method: "DELETE", credentials: "include" },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Leave failed");
        return;
      }

      alert("Left club successfully");
      setIsMember(false);
    } catch (err) {
      console.error("Leave error:", err);
      alert("Network or server error");
    }
  };

  return (
    <div className="clubSidebar">
      <div className="aboutSection">
        <h2>r/{club.name}</h2>
        <p className="description">{club.description}</p>

        <div className="stats">
          <div className="stat">
            <strong>{club.memberCount}</strong>
            <span>Members</span>
          </div>
        </div>

        {isMember && (
          <button className="leaveBtn" onClick={handleLeave}>
            Leave
          </button>
        )}

        {isModerator && (
          <button
            className="editClubBtn"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Club
          </button>
        )}
      </div>

      {isEditOpen && (
        <EditClubModal
          key={club?._id || club?.name}
          club={club}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updatedClub) => {
            //update club in parent immediately
            onClubUpdated?.(updatedClub);
            //close modal
            setIsEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default ClubSidebar;
