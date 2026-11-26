import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Post from "../Models/Post.js";
import { resolveUploadUrl } from "../cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Disk folder for local uploads. NOTE the capital "Uploads": the Express
// static mount in app.js serves this exact folder at the /uploads URL
// prefix, and it already holds the base project's uploaded files. Multer
// destinations MUST be absolute paths inside it — the original base used
// CWD-relative "uploads/..." (lowercase), which on case-sensitive Linux is
// a different folder from the served "Uploads/", so fresh uploads 404'd.
const UPLOAD_ROOT = path.join(__dirname, "..", "Uploads");

const router = express.Router();

// Ensure folders exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Multer storage with dynamic destination (absolute paths under UPLOAD_ROOT)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = UPLOAD_ROOT;

    if (file.fieldname === "avatar") {
      uploadPath = path.join(UPLOAD_ROOT, "avatars");
    } else if (file.fieldname === "postImage") {
      uploadPath = path.join(UPLOAD_ROOT, "posts");
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

// Router to upload avatar images
router.post("/avatar", upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Cloudinary absolute URL when configured, else the local /uploads path.
  const avatarUrl = await resolveUploadUrl(req.file, {
    folder: "avatars",
    resourceType: "image",
    localUrl: `/uploads/avatars/${req.file.filename}`,
  });
  return res.status(200).json({ avatarUrl });
});

// Router to upload post images
router.post("/post-image", upload.single("postImage"), async (req, res) => {
  try {
    const { postId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const imageUrl = await resolveUploadUrl(req.file, {
      folder: "posts",
      resourceType: "image",
      localUrl: `/uploads/posts/${req.file.filename}`,
    });
    post.media = { url: imageUrl };
    await post.save();

    return res.status(200).json({
      message: "Post image uploaded successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("Post image upload error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// CLUB BANNER + ICON UPLOAD (Edit Club)
const clubStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "banner") {
      ensureDir(path.join(UPLOAD_ROOT, "club", "banners"));
      cb(null, path.join(UPLOAD_ROOT, "club", "banners"));
    } else if (file.fieldname === "icon") {
      ensureDir(path.join(UPLOAD_ROOT, "club", "icons"));
      cb(null, path.join(UPLOAD_ROOT, "club", "icons"));
    } else {
      cb(new Error("Invalid upload field"), null);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const uploadClub = multer({ storage: clubStorage });

router.post(
  "/club/banner",
  uploadClub.single("banner"),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ message: "No banner uploaded" });

    const bannerUrl = await resolveUploadUrl(req.file, {
      folder: "club/banners",
      resourceType: "image",
      localUrl: `/uploads/club/banners/${req.file.filename}`,
    });
    return res.status(200).json({ bannerUrl });
  },
);

router.post("/club/icon", uploadClub.single("icon"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No icon uploaded" });

  const iconUrl = await resolveUploadUrl(req.file, {
    folder: "club/icons",
    resourceType: "image",
    localUrl: `/uploads/club/icons/${req.file.filename}`,
  });
  return res.status(200).json({ iconUrl });
});

// DOCUMENT UPLOAD (announcements + post attachments)
// Accepts PDF / Word / PowerPoint files, stored under uploads/documents.
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDir(path.join(UPLOAD_ROOT, "documents"));
    cb(null, path.join(UPLOAD_ROOT, "documents"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const ALLOWED_DOCUMENTS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_DOCUMENTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Word and PowerPoint files are allowed"));
    }
  },
});

router.post("/document", uploadDocument.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Documents go to Cloudinary as "raw" files when configured.
  const documentUrl = await resolveUploadUrl(req.file, {
    folder: "documents",
    resourceType: "raw",
    localUrl: `/uploads/documents/${req.file.filename}`,
  });
  return res.status(200).json({
    documentUrl,
    fileName: req.file.originalname,
  });
});

export default router;
