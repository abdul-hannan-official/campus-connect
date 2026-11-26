//const tabs = ["Posts", "Clubs", "Comments","Saved"];
export default function ProfileTabs({isMyProfile, activeTab, setActiveTab }) {
  const tabs = isMyProfile?["Posts", "Clubs", "Comments","Saved"]:["Posts", "Clubs", "Comments"];
  return (
    <div className="profile-tabs card">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`profile-tab ${activeTab === tab ? "active" : ""}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
