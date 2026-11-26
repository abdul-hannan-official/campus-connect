// Resolve a stored media URL for display.
//
// The backend stores uploads as relative paths ("/uploads/...") in local
// dev, and as absolute Cloudinary URLs (https://res.cloudinary.com/...) when
// Cloudinary is configured for production. Absolute URLs are returned as-is;
// relative ones are prefixed with the backend API origin.
export function resolveMediaUrl(url) {
  if (!url) return url;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  return `${import.meta.env.VITE_API_URL}${url}`;
}

export default resolveMediaUrl;
