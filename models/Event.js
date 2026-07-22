import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String },
});

const timelineItemSchema = new mongoose.Schema({
  time:  { type: String, required: true },
  label: { type: String, required: true },
});

const prizeSchema = new mongoose.Schema({
  place:  { type: String, required: true },
  label:  { type: String, required: true },
  amount: { type: String },
  perks:  { type: [String], default: [] },
});

const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  tier: { type: String },
  url:  { type: String },
});

const judgeSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  title:   { type: String },
  company: { type: String },
  photo:   { type: String },
  bio:     { type: String },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
});

const eventSchema = new mongoose.Schema({
  eventType: { type: String, enum: ["hackathon", "meetup"], required: true },

  // Shared fields
  title:                { type: String, required: true },
  banner:               { type: String, required: true },
  thumbnail:            { type: String },
  venue:                { type: String, required: true },
  city:                 { type: String, required: true },
  date:                 { type: String, required: true },
  time:                 { type: String, required: true },
  capacity:             { type: String },
  registrationDeadline: { type: String },
  registrationLink: { type: String, default: "" },
  description:          { type: String },
  venueImages:          { type: [String], default: [] },
  timeline:             { type: [timelineItemSchema], default: [] },
  sponsors:             { type: [sponsorSchema], default: [] },
  contact: {
    email:    { type: String },
    twitter:  { type: String },
    discord:  { type: String },
    whatsapp: { type: String },
  },

  // Hackathon-only fields
  edition:    { type: String },
  themeImage: { type: String },
  problemStatement: {
    theme:    { type: String },
    overview: { type: String },
    tracks:   { type: [trackSchema], default: [] },
  },
  prizes:  { type: [prizeSchema], default: [] },
  judges:  { type: [judgeSchema], default: [] },
  faqs:    { type: [faqSchema],   default: [] },

  // Meetup-only
  rsvpRole: { type: String },

  stats: {
    builders: { type: String, default: "" },
    duration: { type: String, default: "" },
    prizePool: { type: String, default: "" },
  },

  featured: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
}, { strict: true });

export const Event = mongoose.model("Event", eventSchema);