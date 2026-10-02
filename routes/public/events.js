import express from "express";
import { Event } from "../../models/Event.js";
import mutler from 'multer'

const router = express.Router();

const storage = multer.memoryStorage()
const upload = mutler({storage: storage})


// GET /apients — list all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch {
    res.status(500).json({ message: "Failed to fetch events." });
  }
});

// GET /api/events/featured — get featured events
router.get("/featured", async (req, res) => {
  try {
    const events = await Event.find({ featured: true }).sort({ createdAt: -1 });
    res.json(events);
  } catch {
    res.status(500).json({ message: "Failed to fetch featured events." });
  }
});

// GET /api/events/:id — get single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json(event);
  } catch {
    res.status(500).json({ message: "Failed to fetch event." });
  }
});

export default router;
