const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Swap",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    aiModeration: {
      isModerated: {
        type: Boolean,
        default: false,
      },
      isSafe: {
        type: Boolean,
        default: true,
      },
      moderationResult: {
        type: String,
        default: null,
      },
      moderatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ swapId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ isFlagged: 1 });

// Virtual for message status
messageSchema.virtual("status").get(function () {
  if (this.isDeleted) return "deleted";
  if (this.isFlagged) return "flagged";
  return "active";
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function (userId) {
  const existingRead = this.readBy.find((read) => read.userId.equals(userId));
  if (!existingRead) {
    this.readBy.push({
      userId: userId,
      readAt: new Date(),
    });
    return true;
  }
  return false;
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  const existingReaction = this.reactions.find(
    (reaction) => reaction.userId.equals(userId) && reaction.emoji === emoji
  );

  if (!existingReaction) {
    this.reactions.push({
      userId: userId,
      emoji: emoji,
      createdAt: new Date(),
    });
    return true;
  }
  return false;
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId, emoji) {
  const reactionIndex = this.reactions.findIndex(
    (reaction) => reaction.userId.equals(userId) && reaction.emoji === emoji
  );

  if (reactionIndex !== -1) {
    this.reactions.splice(reactionIndex, 1);
    return true;
  }
  return false;
};

// Method to flag message
messageSchema.methods.flagMessage = function (userId, reason) {
  const existingFlag = this.flaggedBy.find((flag) =>
    flag.userId.equals(userId)
  );
  if (!existingFlag) {
    this.flaggedBy.push({
      userId: userId,
      reason: reason,
      flaggedAt: new Date(),
    });
    this.isFlagged = true;
    return true;
  }
  return false;
};

// Method to delete message
messageSchema.methods.deleteMessage = function (userId) {
  if (!this.isDeleted) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return true;
  }
  return false;
};

// Method to edit message
messageSchema.methods.editMessage = function (newContent) {
  if (!this.isDeleted) {
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    return true;
  }
  return false;
};

// Static method to find messages for a swap
messageSchema.statics.findBySwapId = function (swapId, options = {}) {
  const query = {
    swapId: swapId,
    isDeleted: false,
  };

  if (options.limit) {
    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .populate("senderId", "name avatar")
      .populate("readBy.userId", "name avatar");
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("senderId", "name avatar")
    .populate("readBy.userId", "name avatar");
};

// Static method to find unread messages for a user
messageSchema.statics.findUnreadForUser = function (userId, swapId) {
  return this.find({
    swapId: swapId,
    senderId: { $ne: userId },
    isDeleted: false,
    "readBy.userId": { $ne: userId },
  }).countDocuments();
};

// Pre-save middleware for AI moderation
messageSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isDeleted) {
    // This will be handled by the AI service integration
    this.aiModeration.isModerated = false;
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
