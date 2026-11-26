import mongoose from "mongoose";
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    // Post kind. The original schema referenced `this.type` in the
    // content-required check but never declared the field, so content
    // was effectively never required. Declared here explicitly.
    type: {
      type: String,
      enum: ["text", "link", "image"],
      default: "text",
    },
    // For "link" posts this holds the shared URL.
    linkUrl: { type: String, default: "" },
    content: {
      type: String,
      required: function () {
        return this.type === "text";
      },
  },
    // Document attachments (PDF/DOC/DOCX/PPT) uploaded via /upload/document.
    attachments: [{ type: String, default: [] }],

    media: {
      url: { type: String, default: "" }
    },
    upvoteCount: { type: Number, default: 0 },
    downvoteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    isRemoved: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false }
  },
  { collection: "posts" }
);

export default mongoose.model("Post", PostSchema);
