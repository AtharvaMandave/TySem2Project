import mongoose from "mongoose";

const RsvpSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "declined"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Rsvp || mongoose.model("Rsvp", RsvpSchema);
