import mongoose from "mongoose";
const { Schema } = mongoose;

// Official departmental announcement.
// Shape copied from Harshit Campus-Connect's announcement.model.js and
// extended per the official spec (section B): an announcement may include
// text, links or attachments, with the publication date/time displayed
// (createdAt is always shown in the UI).
const AnnouncementSchema = new Schema(
  {
    title: { type: String, default: "" },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    // Optional external link (e.g. a form, a notice PDF on Drive).
    link: { type: String, default: "" },
    // Uploaded file URLs (via /upload/document).
    attachments: [{ type: String, default: [] }],
    // Club-specific announcement (optional). Without a club it is global.
    club: { type: Schema.Types.ObjectId, ref: "Club", default: null },
    isGlobal: { type: Boolean, default: false },
    category: {
      type: String,
      enum: [
        "Event Notices",
        "Important Updates",
        "Club & Group Announcements",
        "Achievements & Highlights",
      ],
      required: true,
    },
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true, collection: "announcements" }
);

export default mongoose.model("Announcement", AnnouncementSchema);
