const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
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
      default: null,
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
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        swapRequests: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
      privacy: {
        profileVisible: { type: Boolean, default: true },
        showEmail: { type: Boolean, default: false },
        showLocation: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

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

// Method to get public profile (excluding sensitive data)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.email;
  delete userObject.supabaseId;
  delete userObject.isBanned;
  delete userObject.banReason;
  delete userObject.preferences;
  return userObject;
};

// Method to check if user can perform actions
userSchema.methods.canPerformAction = function () {
  return this.isActive && !this.isBanned;
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
