import mongoose from "mongoose";
const { Schema } = mongoose;

// A report filed by a student against a post or a comment.
// Shape follows Commune's Report model (TypeScript, rewritten in JS):
// reporter, post, reason (enum), details, status open/resolved,
// resolvedBy, resolvedAt, createdAt.
const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "misinformation",
        "inappropriate_content",
        "other",
      ],
      required: true,
    },
    details: { type: String, default: "", maxlength: 300 },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "reports" }
);

// One open report per user per post (a user can re-report after resolution).
ReportSchema.index(
  { reporter: 1, post: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

export default mongoose.model("Report", ReportSchema);
