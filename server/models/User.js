const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    skillsOffered: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "intermediate",
        },
        description: {
          type: String,
          maxlength: 200,
        },
      },
    ],
    skillsWanted: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "beginner",
        },
        description: {
          type: String,
          maxlength: 200,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    completedSwaps: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        profileVisible: { type: Boolean, default: true },
        showEmail: { type: Boolean, default: false },
        showLocation: { type: Boolean, default: true },
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Indexes for better query performance
userSchema.index({ "skillsOffered.name": 1 });
userSchema.index({ "skillsWanted.name": 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ rating: -1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Method to get public profile (excluding sensitive info)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Method to check if user can perform action (not banned)
userSchema.methods.canPerformAction = function () {
  return !this.isBanned;
};

// Static method to find users by skill
userSchema.statics.findBySkill = function (skillName, options = {}) {
  const query = {
    isActive: true,
    isBanned: false,
    $or: [
      { "skillsOffered.name": { $regex: skillName, $options: "i" } },
      { "skillsWanted.name": { $regex: skillName, $options: "i" } },
    ],
  };

  if (options.role) {
    query.role = options.role;
  }

  return this.find(query);
};

module.exports = mongoose.model("User", userSchema);
