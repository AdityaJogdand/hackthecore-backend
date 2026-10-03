import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "./auth.js";

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype in EXT),
});

// POST /api/admin/upload — multipart field "images" (one or many) → [{ url }]
router.post("/", requireAdmin, upload.array("images", 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "No valid images (jpeg/png/webp/gif/svg, max 5MB)." });
  try {
    const urls = await Promise.all(req.files.map(async (file) => {
      const key = `events/${crypto.randomUUID()}.${EXT[file.mimetype]}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      return `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }));
    res.status(201).json({ urls });
  } catch (err) {
    console.error("S3 upload failed:", err);
    res.status(500).json({ message: "Image upload failed." });
  }
});

export default router;
