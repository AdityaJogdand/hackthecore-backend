import jwt from "jsonwebtoken";

export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  try {
    jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    req.admin = { username: process.env.ADMIN_USERNAME };
    next();
  } catch {
    res.status(401).json({ message: "Token expired or invalid." });
  }
};
