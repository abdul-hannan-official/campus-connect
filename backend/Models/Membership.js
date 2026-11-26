import mongoose from "mongoose";
const { Schema } = mongoose;

const MembershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    role: { type: String, enum: ["member", "moderator"], default: "member" },
    joinedAt: { type: Date, default: Date.now }
  },
  { collection: "memberships" }
);

MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

export default mongoose.model("Membership", MembershipSchema);
