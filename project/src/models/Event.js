import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      required: [true, "Event time is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteTarget: {
      type: String,
      required: true,
      enum: {
        values: ["students", "alumni", "all"],
        message: "Invite target must be students, alumni, or all",
      },
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ date: -1 });
EventSchema.index({ inviteTarget: 1 });

export default mongoose.models.Event ||
  mongoose.model("Event", EventSchema);
