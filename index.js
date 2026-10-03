import "./loadEnv.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";

// Public routes
import publicAuthRoutes from "./routes/public/auth.js";
import publicEventRoutes from "./routes/public/events.js";
import publicPartnershipRoutes from "./routes/public/partnerships.js";
import publicProjectRoutes from "./routes/public/projects.js";

// Admin routes
import adminAuthRoutes from "./routes/admin/auth.js";
import adminEventRoutes from "./routes/admin/events.js";
import adminPartnershipRoutes from "./routes/admin/partnerships.js";
import adminProjectRoutes from "./routes/admin/projects.js";
import adminUploadRoutes from "./routes/admin/upload.js";


const app = express();

/* -------------------------------------------------------------------------- */
/*                               Security                                      */
/* -------------------------------------------------------------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

/* -------------------------------------------------------------------------- */
/*                                  CORS                                      */
/* -------------------------------------------------------------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log("Blocked CORS request from:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* -------------------------------------------------------------------------- */
/*                             Middleware                                     */
/* -------------------------------------------------------------------------- */

app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());

/* -------------------------------------------------------------------------- */
/*                            Public Routes                                   */
/* -------------------------------------------------------------------------- */

app.use("/api/auth", publicAuthRoutes);
app.use("/api/events", publicEventRoutes);
app.use("/api/partnerships", publicPartnershipRoutes);
app.use("/api/projects", publicProjectRoutes);

/* -------------------------------------------------------------------------- */
/*                            Admin Routes                                    */
/* -------------------------------------------------------------------------- */

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/events", adminEventRoutes);
app.use("/api/admin/partnerships", adminPartnershipRoutes);
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/upload", adminUploadRoutes);

/* -------------------------------------------------------------------------- */
/*                               Health Check                                 */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HackTheCore API is running",
  });
});

/* -------------------------------------------------------------------------- */
/*                             Error Handler                                  */
/* -------------------------------------------------------------------------- */

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* -------------------------------------------------------------------------- */
/*                              Database                                      */
/* -------------------------------------------------------------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });
