import mongoose from "mongoose";
const { Schema } = mongoose;

// Department event.
// Shape adapted from Keshav833/CampusConnect's Event model, simplified to
// English-only fields (Keshav's multilingual title/description dropped),
// with `status` added per the official spec (section C): admins can
// create, update or cancel events. Cancelled events stay visible in the
// past-events view with their status shown.
const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["workshop", "seminar", "competition", "department"],
      default: "department",
    },
    // Event day.
    date: { type: Date, required: true },
    // Event time, e.g. "10:00 AM - 12:00 PM".
    time: { type: String, required: true },
    // Venue (official spec field name is "venue").
    venue: { type: String, required: true },
    image: { type: String, default: "" },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: Schema.Types.ObjectId, ref: "Club", default: null },
    status: {
      type: String,
      enum: ["scheduled", "cancelled"],
      default: "scheduled",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "events" }
);

export default mongoose.model("Event", EventSchema);
