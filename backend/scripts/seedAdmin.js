import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../Models/User.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Seeds the three platform admins — Head CR, Head GR and HOD — who share
// the same platform-level access (official spec, section D).
//
//   ADMIN_EMAILS=cr@example.com,gr@example.com,hod@example.com
//   ADMIN_TITLES=Head CR,Head GR,HOD
//   ADMIN_PASSWORD=...            (one shared initial password for all three)
//
// If ADMIN_EMAILS is NOT set, ONE clearly-marked placeholder admin is
// created instead so the admin panel is reachable on a fresh install:
//
//   admin@campusconnect.local / changeme123  (title: Head CR)
//
// >>> WARNING: replace the placeholder admin with the real admin emails
//     before going live. Delete it from the database once real admins exist.
//
// Usage:
//   node scripts/seedAdmin.js
// ---------------------------------------------------------------------------

const PLACEHOLDER = {
  email: "admin@campusconnect.local",
  username: "admin",
  password: "changeme123",
  title: "Head CR",
};

const SALT_ROUNDS = parseInt(process.env.HASHING || "10", 10) || 10;

const seedAdmins = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set. Nothing was seeded.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const emails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const titles = (process.env.ADMIN_TITLES || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const password = process.env.ADMIN_PASSWORD || PLACEHOLDER.password;

  const admins = emails.length
    ? emails.map((email, i) => ({
        email,
        username: email.split("@")[0].replace(/[^a-z0-9._-]/gi, "") || `admin${i + 1}`,
        password,
        title: ["Head CR", "Head GR", "HOD"].includes(titles[i])
          ? titles[i]
          : "Head CR",
      }))
    : [PLACEHOLDER];

  if (!emails.length) {
    console.warn(
      "\n!!! WARNING: ADMIN_EMAILS is not set. Seeding the PLACEHOLDER admin\n" +
        "    admin@campusconnect.local / changeme123 (Head CR).\n" +
        "    Replace it with the real admin emails before going live. !!!\n"
    );
  }

  for (const a of admins) {
    const existing = await User.findOne({ email: a.email });
    if (existing) {
      existing.role = "admin";
      existing.adminTitle = a.title;
      await existing.save();
      console.log(`Updated existing user ${a.email} -> admin (${a.title})`);
      continue;
    }

    const hashed = await bcrypt.hash(a.password, SALT_ROUNDS);
    const user = await User.create({
      username: a.username,
      email: a.email,
      password: hashed,
      bio: "",
      avatarUrl: "",
      createdAt: new Date(),
      lastLogin: new Date(),
      karma: 0,
      role: "admin",
      adminTitle: a.title,
      authProvider: "local",
    });
    console.log(`Created admin ${a.email} (${a.title})`);
  }

  await mongoose.disconnect();
  console.log("Done.");
};

seedAdmins().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
