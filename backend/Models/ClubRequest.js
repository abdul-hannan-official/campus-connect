import mongoose from "mongoose";
const { Schema } = mongoose;

// A student's request to create a new club.
// Shape copied from Harshit Campus-Connect's GroupRequest model:
// { user, group, status: pending | approved | rejected, timestamps }.
// The club itself is created at request time with status "pending" and
// only becomes visible in Explore once an admin approves the request.
const ClubRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, collection: "clubrequests" }
);

export default mongoose.model("ClubRequest", ClubRequestSchema);
