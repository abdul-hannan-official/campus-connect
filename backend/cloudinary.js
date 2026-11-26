import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Optional Cloudinary uploads (Harshit's cloudinary.js pattern).
//
// Why: Multer saves uploads to the backend's local disk, which does NOT
// persist on Vercel serverless functions. When the three CLOUDINARY_* env
// vars are set, uploaded files are pushed to Cloudinary instead and the
// returned URL is an absolute https://res.cloudinary.com/... link that the
// frontend can use directly. When they are NOT set, nothing changes: files
// stay on local disk exactly as before (local dev behaviour untouched).
//
// Env vars (see backend/.env.example):
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

// Upload a Multer-saved temp file to Cloudinary and delete the local copy.
// Returns the absolute secure_url. Throws on upload failure (the caller
// turns that into a 500 — better than returning a local path that will 404
// on Vercel). resourceType: "image" for photos, "raw" for documents.
export async function uploadToCloudinary(localPath, { folder, resourceType = "image" }) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: `campus-connect/${folder}`,
      resource_type: resourceType,
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err?.message || err);
    throw err;
  } finally {
    // Always clean up the temp file, success or failure.
    fs.unlink(localPath, () => {});
  }
}

// Resolve the URL to store/return for an uploaded file:
// Cloudinary absolute URL when configured, otherwise the local /uploads path.
export async function resolveUploadUrl(reqFile, { folder, resourceType, localUrl }) {
  if (!reqFile) return null;
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(reqFile.path, { folder, resourceType });
  }
  return localUrl;
}

export default cloudinary;
