import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    class: {
      type: String,
      required: [true, "Please provide your class"],
      trim: true,
    },
    division: {
      type: String,
      required: [true, "Please provide your division"],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, "Please provide your roll number"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StudentProfile ||
  mongoose.model("StudentProfile", StudentProfileSchema);
