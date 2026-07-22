import express from "express";
import { Partnership } from "../../models/Partnership.js";
import { requireAdmin } from "./auth.js";

const router = express.Router();

// GET /api/admin/partnerships — list all bookings
router.get("/", requireAdmin, async (req, res) => {
  try {
    const list = await Partnership.find().sort({ submittedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error fetching bookings list." });
  }
});

// PATCH /api/admin/partnerships/:id/toggle-call — toggle callDone status
router.patch("/:id/toggle-call", requireAdmin, async (req, res) => {
  try {
    const partnership = await Partnership.findById(req.params.id);
    if (!partnership) {
      return res.status(404).json({ message: "Booking record not found." });
    }
    partnership.callDone = !partnership.callDone;
    await partnership.save();
    res.json(partnership);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to toggle booking call status." });
  }
});

export default router;
