import mongoose from "mongoose";
const { Schema } = mongoose;

const ClubSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },   // r/club
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    nsfw: { type: Boolean, default: false },
    memberCount: { type: Number, default: 0 },
    bannerUrl: { type: String, default: "" },
    iconUrl:   { type: String, default: "" },
    // Club approval workflow (Harshit GroupRequest pattern).
    // Students request a club -> status "pending" -> admin approves/rejects.
    // Only "approved" clubs are listed in Explore.
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    isPublic: { type: Boolean, default: true },

  },
  { collection: "clubs" }
);

export default mongoose.model("Club", ClubSchema);
