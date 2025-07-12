const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Swap",
      required: true,
      index: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offererId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 15,
      max: 480,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
      index: true,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    meetingProvider: {
      type: String,
      enum: ["google-meet", "zoom", "teams", "custom"],
      default: "google-meet",
    },
    location: {
      type: String,
      default: null,
    },
    notes: {
      preSession: {
        type: String,
        maxlength: 1000,
      },
      postSession: {
        type: String,
        maxlength: 1000,
      },
    },
    transcript: {
      type: String,
      default: null,
    },
    summary: {
      type: String,
      default: null,
    },
    aiGeneratedSummary: {
      type: String,
      default: null,
    },
    recordingUrl: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
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
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: null,
        },
        leftAt: {
          type: Date,
          default: null,
        },
        duration: {
          type: Number, // in minutes
          default: 0,
        },
      },
    ],
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
sessionSchema.index({ swapId: 1 });
sessionSchema.index({ requesterId: 1, status: 1 });
sessionSchema.index({ offererId: 1, status: 1 });
sessionSchema.index({ scheduledTime: 1 });
sessionSchema.index({ status: 1, scheduledTime: 1 });

// Virtual for session duration in hours
sessionSchema.virtual("durationHours").get(function () {
  return this.duration / 60;
});

// Virtual for actual session duration
sessionSchema.virtual("actualDuration").get(function () {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Method to check if session can be modified
sessionSchema.methods.canBeModified = function () {
  return ["scheduled"].includes(this.status);
};

// Method to check if user is participant
sessionSchema.methods.isParticipant = function (userId) {
  return this.requesterId.equals(userId) || this.offererId.equals(userId);
};

// Method to start session
sessionSchema.methods.startSession = function () {
  if (this.status === "scheduled") {
    this.status = "in-progress";
    this.startedAt = new Date();
    return true;
  }
  return false;
};

// Method to end session
sessionSchema.methods.endSession = function () {
  if (this.status === "in-progress") {
    this.status = "completed";
    this.endedAt = new Date();
    return true;
  }
  return false;
};

// Method to cancel session
sessionSchema.methods.cancelSession = function (userId, reason = null) {
  if (this.status === "scheduled") {
    this.status = "cancelled";
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
    this.cancelReason = reason;
    return true;
  }
  return false;
};

// Static method to find upcoming sessions for a user
sessionSchema.statics.findUpcomingForUser = function (userId) {
  return this.find({
    $or: [{ requesterId: userId }, { offererId: userId }],
    status: "scheduled",
    scheduledTime: { $gte: new Date() },
  })
    .populate("swapId")
    .populate("requesterId", "name avatar")
    .populate("offererId", "name avatar");
};

// Static method to find completed sessions for a user
sessionSchema.statics.findCompletedForUser = function (userId) {
  return this.find({
    $or: [{ requesterId: userId }, { offererId: userId }],
    status: "completed",
  })
    .populate("swapId")
    .populate("requesterId", "name avatar")
    .populate("offererId", "name avatar");
};

module.exports = mongoose.model("Session", sessionSchema);
