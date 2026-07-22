import mongoose from "mongoose";

const partnershipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  org: { type: String },
  phone: { type: String },
  partnershipType: { type: String, required: true },
  callDone: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
}, {
  collection: "partnerships",
});

export const Partnership = mongoose.models.Partnership || mongoose.model("Partnership", partnershipSchema);
