const mongoose = require("mongoose");

const swapSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    offererId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skillOffered: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        required: true,
      },
      description: {
        type: String,
        maxlength: 500,
      },
    },
    skillRequested: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        required: true,
      },
      description: {
        type: String,
        maxlength: 500,
      },
    },
    description: {
      type: String,
      maxlength: 1000,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
      min: 15,
      max: 480, // 8 hours max
    },
    location: {
      type: String,
      default: null,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    notes: {
      requester: {
        type: String,
        maxlength: 500,
      },
      offerer: {
        type: String,
        maxlength: 500,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isUrgent: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    feedback: {
      requesterRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      offererRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      requesterComment: {
        type: String,
        maxlength: 500,
      },
      offererComment: {
        type: String,
        maxlength: 500,
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelReason: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
swapSchema.index({ requesterId: 1, status: 1 });
swapSchema.index({ offererId: 1, status: 1 });
swapSchema.index({ status: 1, createdAt: -1 });
swapSchema.index({ "skillOffered.name": 1 });
swapSchema.index({ "skillRequested.name": 1 });
swapSchema.index({ scheduledTime: 1 });

// Virtual for swap duration in hours
swapSchema.virtual("durationHours").get(function () {
  return this.duration / 60;
});

// Method to check if swap can be modified
swapSchema.methods.canBeModified = function () {
  return ["pending", "accepted"].includes(this.status);
};

// Method to check if user is participant
swapSchema.methods.isParticipant = function (userId) {
  return this.requesterId.equals(userId) || this.offererId.equals(userId);
};

// Method to get the other participant
swapSchema.methods.getOtherParticipant = function (userId) {
  if (this.requesterId.equals(userId)) {
    return this.offererId;
  } else if (this.offererId.equals(userId)) {
    return this.requesterId;
  }
  return null;
};

// Static method to find active swaps for a user
swapSchema.statics.findActiveForUser = function (userId) {
  return this.find({
    $or: [{ requesterId: userId }, { offererId: userId }],
    status: { $in: ["pending", "accepted"] },
  })
    .populate("requesterId", "name avatar")
    .populate("offererId", "name avatar");
};

// Static method to find completed swaps for a user
swapSchema.statics.findCompletedForUser = function (userId) {
  return this.find({
    $or: [{ requesterId: userId }, { offererId: userId }],
    status: "completed",
  })
    .populate("requesterId", "name avatar")
    .populate("offererId", "name avatar");
};

// Pre-save middleware to update timestamps
swapSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === "cancelled" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model("Swap", swapSchema);
