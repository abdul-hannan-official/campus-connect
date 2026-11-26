import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../Models/User.js";
import Club from "../Models/Club.js";
import Post from "../Models/Post.js";
import Announcement from "../Models/Announcement.js";
import Event from "../Models/Event.js";
import Membership from "../Models/Membership.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Seeds clearly-marked DEMO data for local testing / viva demos:
//   - 2 demo clubs (approved): "Programming Club", "AI & ML Society"
//   - 1 demo announcement (global, category "Important Updates")
//   - 2 demo events (one upcoming, one past)
//   - 2 demo posts in the Programming Club
//
// The demo content is generic placeholder data, NOT real department data.
// It is owned by the placeholder admin (admin@campusconnect.local) — run
// scripts/seedAdmin.js first. Safe to delete: the script is idempotent
// (skips anything that already exists).
//
// Usage:
//   node scripts/seedDemo.js
// ---------------------------------------------------------------------------

const DEMO_ADMIN_EMAIL = "admin@campusconnect.local";

const seedDemo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set. Nothing was seeded.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const admin = await User.findOne({ email: DEMO_ADMIN_EMAIL });
  if (!admin) {
    console.error(
      `Demo admin (${DEMO_ADMIN_EMAIL}) not found. Run scripts/seedAdmin.js first.`
    );
    process.exit(1);
  }

  const ensureClub = async (name, title, description) => {
    let club = await Club.findOne({ name });
    if (club) {
      console.log(`Club "${name}" already exists, skipping.`);
      return club;
    }
    club = await Club.create({
      name,
      title,
      description,
      createdBy: admin._id,
      memberCount: 1,
      status: "approved",
      isPublic: true,
    });
    await Membership.create({
      userId: admin._id,
      clubId: club._id,
      role: "moderator",
      joinedAt: new Date(),
    });
    console.log(`Created club "${name}".`);
    return club;
  };

  const programming = await ensureClub(
    "programming-club",
    "Programming Club",
    "Demo club for programming discussions, coding help and project ideas."
  );
  const aiml = await ensureClub(
    "ai-ml-society",
    "AI & ML Society",
    "Demo club for artificial intelligence and machine learning discussions."
  );

  const existingAnnouncement = await Announcement.findOne({
    title: "Welcome to Campus Connect (Demo)",
  });
  if (!existingAnnouncement) {
    await Announcement.create({
      title: "Welcome to Campus Connect (Demo)",
      sender: admin._id,
      content:
        "This is a demo announcement. Admins publish official departmental notices here; students can read them on the home page.",
      isGlobal: true,
      category: "Important Updates",
    });
    console.log("Created demo announcement.");
  } else {
    console.log("Demo announcement already exists, skipping.");
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const ensureEvent = async (title, date, time, venue, category, club) => {
    const existing = await Event.findOne({ title });
    if (existing) {
      console.log(`Event "${title}" already exists, skipping.`);
      return;
    }
    await Event.create({
      title,
      description: `Demo ${category} event. Replace with real department events.`,
      category,
      date,
      time,
      venue,
      organizer: admin._id,
      club: club ? club._id : null,
      status: "scheduled",
    });
    console.log(`Created demo event "${title}".`);
  };

  await ensureEvent(
    "Intro to Data Structures Workshop (Demo)",
    tomorrow,
    "10:00 AM - 12:00 PM",
    "CS Department, Lab 1",
    "workshop",
    programming
  );
  await ensureEvent(
    "AI Guest Talk (Demo)",
    lastWeek,
    "2:00 PM - 3:30 PM",
    "CS Department, Seminar Hall",
    "seminar",
    aiml
  );

  const existingPost = await Post.findOne({
    title: "Welcome to the Programming Club (Demo)",
  });
  if (!existingPost) {
    await Post.create({
      clubId: programming._id,
      authorId: admin._id,
      title: "Welcome to the Programming Club (Demo)",
      content:
        "Demo post: introduce yourself, share what you are learning, and ask questions here.",
      type: "text",
    });
    await Club.findByIdAndUpdate(programming._id, { $inc: { memberCount: 0 } });
    console.log("Created demo post.");
  } else {
    console.log("Demo post already exists, skipping.");
  }

  await mongoose.disconnect();
  console.log("Done.");
};

seedDemo().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
