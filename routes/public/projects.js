import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import Project from "../../models/Project.js";
import { uploadImage, IMAGE_EXT } from "../../lib/s3.js";

const router = express.Router();

const HTTP_URL = /^https?:\/\/.+/;

function safeStr(val, max) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, max);
}
function safeUrl(val) {
  const s = safeStr(val, 500);
  return HTTP_URL.test(s) ? s : "";
}
// http(s) URL → kept as-is; base64 data:image → uploaded to S3, URL returned; anything else → "".
async function safeThumbnail(val) {
  const s = typeof val === "string" ? val.trim() : "";
  if (HTTP_URL.test(s)) return s.slice(0, 500);
  const m = s.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!m || !(m[1] in IMAGE_EXT)) return "";
  return uploadImage(Buffer.from(m[2], "base64"), m[1], "projects");
}

// GET /api/projects/approved — public list of approved projects
router.get("/approved", async (req, res) => {
  try {
    const projects = await Project.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name avatar")
      .lean();
    res.json(projects);
  } catch (err) {
    console.error("Error fetching approved projects:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/projects — submit a new project (authenticated user)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, hackathon, date, track, stack, github, demo, team, thumbnail } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }
    if (!hackathon || typeof hackathon !== "string" || !hackathon.trim()) {
      return res.status(400).json({ message: "Hackathon name is required." });
    }
    if (!Array.isArray(stack) || !Array.isArray(team)) {
      return res.status(400).json({ message: "stack and team must be arrays." });
    }
    if (stack.length > 20) return res.status(400).json({ message: "stack cannot exceed 20 items." });
    if (team.length > 10) return res.status(400).json({ message: "team cannot exceed 10 members." });

    const newProject = new Project({
      title: safeStr(title, 150),
      hackathon: safeStr(hackathon, 150),
      date: safeStr(date, 50),
      track: safeStr(track, 100),
      stack: stack.map((s) => safeStr(s, 50)).filter(Boolean),
      github: safeUrl(github),
      demo: safeUrl(demo),
      team: team.map((t) => safeStr(t, 100)).filter(Boolean),
      thumbnail: await safeThumbnail(thumbnail),
      submittedBy: req.userId,
    });

    const savedProject = await newProject.save();
    res.status(201).json({
      message: "Project submitted successfully. Awaiting admin approval.",
      project: { id: savedProject._id, title: savedProject.title, status: savedProject.status, createdAt: savedProject.createdAt },
    });
  } catch (err) {
    console.error("Project submission error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

export default router;
