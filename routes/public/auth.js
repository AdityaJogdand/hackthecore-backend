import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../../models/User.js";

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const name = profile.displayName || profile.username || "Google User";
        const avatar = profile.photos?.[0]?.value || "";
        const googleId = profile.id;

        if (!email) {
          return done(null, false, { message: "No email address linked to this Google account." });
        }

        let user = await User.findByEmail(email);

        if (user) {
          if (!user.googleId) user.googleId = googleId;
          if (avatar) user.avatar = avatar;
          if (user.provider === "local") user.provider = "google";
          await user.save();
        } else {
          user = await User.create({ name, email, avatar, provider: "google", googleId });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true, legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Too many registrations. Try again in 15 minutes." },
  standardHeaders: true, legacyHeaders: false,
});

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { message: "Too many OAuth attempts. Try again later." },
  standardHeaders: true, legacyHeaders: false,
});

const meLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { message: "Too many requests." },
  standardHeaders: true, legacyHeaders: false,
});

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

function sanitizeString(val, maxLen = 254) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

function validatePassword(password) {
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password cannot exceed 128 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

// POST /api/auth/register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const name = sanitizeString(req.body?.name, 100);
    const email = sanitizeString(req.body?.email, 254).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!name) return res.status(400).json({ message: "Name is required." });
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: "A valid email is required." });
    }

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ message: pwError });

    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, passwordHash: password, provider: "local" });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, provider: user.provider },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = sanitizeString(req.body?.email, 254).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findByEmailWithPassword(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    if (user.provider === "google" && !user.passwordHash) {
      return res.status(401).json({ message: "This account uses Google sign-in. Please log in with Google." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, provider: user.provider },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// GET /api/auth/google
router.get("/google", googleLimiter, passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  googleLimiter,
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=GoogleOAuthFailed`, session: false }),
  async (req, res) => {
    try {
      if (!req.user) return res.redirect(`${process.env.CLIENT_URL}/login?error=GoogleOAuthFailed`);
      const token = signToken(req.user);
      res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
    } catch (err) {
      console.error("Google callback redirect error:", err);
      res.redirect(`${process.env.CLIENT_URL}/login?error=ServerError`);
    }
  }
);

// GET /api/auth/me
router.get("/me", meLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated." });

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found." });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, provider: user.provider },
    });
  } catch (err) {
    console.error("Auth/me error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
