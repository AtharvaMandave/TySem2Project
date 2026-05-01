import mongoose from "mongoose";

const AlumniProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    passingYear: {
      type: Number,
      required: [true, "Please provide your passing year"],
    },
    currentStatus: {
      type: String,
      required: [true, "Please provide your current status"],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    college: {
      type: String,
      trim: true,
      default: "",
    },
    privacy: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AlumniProfile ||
  mongoose.model("AlumniProfile", AlumniProfileSchema);
