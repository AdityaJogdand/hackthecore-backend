import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    hackathon: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      trim: true,
    },
    track: {
      type: String,
      trim: true,
    },
    stack: {
      type: [String],
      default: [],
    },
    github: {
      type: String,
      trim: true,
    },
    demo: {
      type: String,
      trim: true,
    },
    team: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: String, // admin username from env
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
projectSchema.index({ status: 1 });
projectSchema.index({ submittedBy: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;