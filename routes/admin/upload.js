import express from "express";
import multer from "multer";
import { uploadImage, IMAGE_EXT } from "../../lib/s3.js";
import { requireAdmin } from "./auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype in IMAGE_EXT),
});

// POST /api/admin/upload — multipart field "images" (one or many) → [{ url }]
router.post("/", requireAdmin, upload.array("images", 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "No valid images (jpeg/png/webp/gif/svg, max 5MB)." });
  try {
    const urls = await Promise.all(req.files.map((file) => uploadImage(file.buffer, file.mimetype, "events")));
    res.status(201).json({ urls });
  } catch (err) {
    console.error("S3 upload failed:", err);
    res.status(500).json({ message: "Image upload failed." });
  }
});

export default router;
