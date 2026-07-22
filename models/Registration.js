import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String },
  github: { type: String },
}, { _id: false });

const hackathonRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  teamName: { type: String, required: true },
  track: { type: String, required: true },
  idea: { type: String },
  members: { type: [memberSchema], required: true, validate: {
    validator: (v) => Array.isArray(v) && v.length > 0,
    message: "At least one team member is required.",
  } },
  submittedAt: { type: Date, default: Date.now },
}, {
  collection: "hackathon_registrations",
});

export const HackathonRegistration = mongoose.models.HackathonRegistration || mongoose.model("HackathonRegistration", hackathonRegistrationSchema);

const meetupRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventTitle: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  experience: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  submittedAt: { type: Date, default: Date.now },
}, {
  collection: "meetup_registrations",
});

export const MeetupRegistration = mongoose.models.MeetupRegistration || mongoose.model('MeetupRegistration', meetupRegistrationSchema);
