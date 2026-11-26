import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    // Password is required only for local (email/password) accounts.
    // Google/GitHub accounts authenticate through their provider instead.
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    karma: { type: Number, default: 0 },
    savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post", default: [] }],
    // Platform role. "moderator" is NOT a global role: per-club moderators
    // are tracked on Membership.role (member | moderator) for a single club.
    role: {
      type: String,
      enum: ["student", "moderator", "admin"],
      default: "student",
    },
    // Admin persona from the official spec: Head CR, Head GR and HOD share
    // the same platform-level access; the title only says who the admin is.
    adminTitle: {
      type: String,
      enum: ["Head CR", "Head GR", "HOD"],
      default: null,
    },
    // How the account was created.
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    googleId: { type: String, default: null, index: true, sparse: true },
    githubId: { type: String, default: null, index: true, sparse: true },
  },
  { collection: "users" }
);

export default mongoose.model("User", UserSchema);
