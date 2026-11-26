import "./InitialAvatar.css";

// Clean initial-letter avatar in the Campus Connect green palette.
// Replaces the old smiley placeholder avatars. If a real uploaded icon
// URL is provided it is used; dicebear placeholder URLs are ignored and
// fall back to initials.
const GREEN_SHADES = [
  "#14532d",
  "#166534",
  "#15803d",
  "#0b3d2e",
  "#1b6e42",
  "#2e7d32",
  "#0f5132",
  "#196344",
];

function shadeFor(name) {
  let hash = 0;
  const s = String(name || "?");
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return GREEN_SHADES[hash % GREEN_SHADES.length];
}

function initialsFor(name) {
  const clean = String(name || "?")
    .replace(/^r\//, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function stripRedditPrefix(name) {
  return String(name || "").replace(/^r\//, "").replace(/^u\//, "");
}

export default function InitialAvatar({
  name,
  iconUrl,
  size = 32,
  className = "",
  title,
}) {
  const hasRealIcon =
    iconUrl && !String(iconUrl).includes("dicebear") && !String(iconUrl).includes("thumbs");
  const displayName = stripRedditPrefix(name);

  if (hasRealIcon) {
    return (
      <img
        src={iconUrl}
        alt={displayName}
        title={title || displayName}
        className={`initial-avatar initial-avatar-img ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`initial-avatar ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: shadeFor(displayName),
        fontSize: Math.max(11, Math.round(size * 0.38)),
      }}
      title={title || displayName}
      aria-label={displayName}
    >
      {initialsFor(displayName)}
    </span>
  );
}
