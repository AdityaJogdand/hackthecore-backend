import express from "express";
import { requireAdmin } from "./auth.js";
import Project from "../../models/Project.js";

const router = express.Router();

// GET /api/admin/projects — list all projects (optional status filter)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name avatar")
      .lean();

    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/admin/projects/:id/approve
router.patch("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { status: "approved", reviewedBy: req.admin.username, reviewedAt: new Date() },
      { new: true }
    ).populate("submittedBy", "name avatar");

    if (!updated) return res.status(404).json({ message: "Project not found." });
    res.json({ message: "Project approved.", project: updated });
  } catch (err) {
    console.error("Error approving project:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/admin/projects/:id/reject
router.patch("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", reviewedBy: req.admin.username, reviewedAt: new Date() },
      { new: true }
    ).populate("submittedBy", "name avatar");

    if (!updated) return res.status(404).json({ message: "Project not found." });
    res.json({ message: "Project rejected.", project: updated });
  } catch (err) {
    console.error("Error rejecting project:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/admin/projects/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found." });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
