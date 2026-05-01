import mongoose from "mongoose";

const FacultyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, "Please provide your subject"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Please select your designation"],
      enum: {
        values: ["Teacher", "Coordinator", "Principal"],
        message: "Designation must be Teacher, Coordinator, or Principal",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FacultyProfile ||
  mongoose.model("FacultyProfile", FacultyProfileSchema);
