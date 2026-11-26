import mongoose from "mongoose";
const { Schema } = mongoose;

// A student's registration for an event.
// Shape from Keshav833/CampusConnect's Registration model.
const RegistrationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["registered", "waitlist"],
      default: "registered",
    },
    registeredAt: { type: Date, default: Date.now },
  },
  { collection: "registrations" }
);

// A user can only register once per event.
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("Registration", RegistrationSchema);
