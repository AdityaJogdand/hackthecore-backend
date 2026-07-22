import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { timingSafeEqual, createHash } from "crypto";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { valid: false },
});

// POST /api/admin/login
router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  const hash = (s) => createHash("sha256").update(s).digest();
  const usernameMatch = timingSafeEqual(hash(username), hash(validUsername));
  const passwordMatch = timingSafeEqual(hash(password), hash(validPassword));
  if (!usernameMatch || !passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
});

// GET /api/admin/verify
router.get("/verify", verifyLimiter, (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// Middleware to protect admin routes
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden." });
    }
    req.admin = { username: process.env.ADMIN_USERNAME };
    next();
  } catch {
    res.status(401).json({ message: "Token expired or invalid." });
  }
};

export default router;
