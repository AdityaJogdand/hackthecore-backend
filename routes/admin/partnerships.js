import express from "express";
import { Partnership } from "../../models/Partnership.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = express.Router();

// GET /api/partnerships/admin/list — view all bookings
router.get("/admin/list", requireAdmin, async (req, res) => {
  try {
    const list = await Partnership.find().sort({ submittedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error fetching bookings list." });
  }
});

// PATCH /api/partnerships/admin/:id/toggle-call — toggle callDone
router.patch("/admin/:id/toggle-call", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const partnership = await Partnership.findById(id);
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
