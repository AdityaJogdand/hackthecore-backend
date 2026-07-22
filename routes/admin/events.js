import express from "express";
import { Event } from "../../models/Event.js";
import { requireAdmin } from "./auth.js";

const router = express.Router();

function pickEventFields(body) {
  const allowed = [
    "eventType", "title", "banner", "thumbnail", "venue", "city", "date", "time",
    "capacity", "registrationDeadline", "registrationLink", "description", "venueImages", "timeline",
    "sponsors", "contact", "edition", "themeImage", "problemStatement", "prizes",
    "judges", "faqs", "rsvpRole", "featured", "stats",
  ];
  const out = {};
  for (const key of allowed) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

// POST /api/admin/events — create event
router.post("/", requireAdmin, async (req, res) => {
  try {
    const event = await Event.create(pickEventFields(req.body));
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create event." });
  }
});

// PUT /api/admin/events/:id — update event
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, pickEventFields(req.body), { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update event." });
  }
});

// PATCH /api/admin/events/:id/featured — toggle featured
router.patch("/:id/featured", requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    event.featured = !event.featured;
    await event.save();
    res.json({ featured: event.featured });
  } catch {
    res.status(500).json({ message: "Failed to toggle featured." });
  }
});

// DELETE /api/admin/events/:id — delete event
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete event." });
  }
});

export default router;
