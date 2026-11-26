import defaultAvatar from "../../assets/default-avatar.png";
export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <img
        src={defaultAvatar}
        alt="Campus Connect"
        className="empty-illustration"
      />
      <h2 className="empty-title">{title}</h2>
      <p className="empty-text">{message}</p>
    </div>
  );
}
