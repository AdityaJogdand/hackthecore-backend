import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      // Not required — Google OAuth users won't have a password
      select: false, // Never returned in queries by default
    },
    avatar: {
      type: String,
      default: "",
      maxlength: [2048, "Avatar URL too long"],
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    googleId: {
      type: String,
      default: "",
      index: { sparse: true },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "users",
    // Strip __v from responses
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// ── Hash password before saving (only for local users) ──
userSchema.pre("save", async function () {
  // Only hash if password was modified and exists
  if (!this.isModified("passwordHash") || !this.passwordHash) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
});

// ── Compare password (timing-safe via bcrypt) ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(
    String(candidatePassword), // Force string to prevent injection
    this.passwordHash
  );
};

// ── Static: find by email with injection protection ──
userSchema.statics.findByEmail = function (email) {
  // Force toString() to prevent NoSQL operator injection ($gt, $ne, etc.)
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

// ── Static: find by email with password included ──
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select(
    "+passwordHash"
  );
};

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;
