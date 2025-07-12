const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Swap",
      required: true,
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    categories: [
      {
        type: String,
        enum: [
          "communication",
          "punctuality",
          "knowledge",
          "teaching_ability",
          "learning_ability",
          "professionalism",
          "friendliness",
          "overall_experience",
        ],
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
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
    helpfulVotes: {
      helpful: {
        type: Number,
        default: 0,
      },
      notHelpful: {
        type: Number,
        default: 0,
      },
      voters: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          vote: {
            type: String,
            enum: ["helpful", "not_helpful"],
            required: true,
          },
          votedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
feedbackSchema.index({ sessionId: 1 });
feedbackSchema.index({ swapId: 1 });
feedbackSchema.index({ fromUserId: 1, toUserId: 1 });
feedbackSchema.index({ rating: -1 });
feedbackSchema.index({ isPublic: 1 });
feedbackSchema.index({ isFlagged: 1 });

// Virtual for average helpful score
feedbackSchema.virtual("helpfulScore").get(function () {
  const total = this.helpfulVotes.helpful + this.helpfulVotes.notHelpful;
  if (total === 0) return 0;
  return (this.helpfulVotes.helpful / total) * 100;
});

// Method to add helpful vote
feedbackSchema.methods.addHelpfulVote = function (userId, vote) {
  const existingVote = this.helpfulVotes.voters.find((voter) =>
    voter.userId.equals(userId)
  );

  if (existingVote) {
    // Update existing vote
    if (existingVote.vote !== vote) {
      if (existingVote.vote === "helpful") {
        this.helpfulVotes.helpful--;
      } else {
        this.helpfulVotes.notHelpful--;
      }

      existingVote.vote = vote;
      existingVote.votedAt = new Date();

      if (vote === "helpful") {
        this.helpfulVotes.helpful++;
      } else {
        this.helpfulVotes.notHelpful++;
      }
    }
  } else {
    // Add new vote
    this.helpfulVotes.voters.push({
      userId: userId,
      vote: vote,
      votedAt: new Date(),
    });

    if (vote === "helpful") {
      this.helpfulVotes.helpful++;
    } else {
      this.helpfulVotes.notHelpful++;
    }
  }

  return true;
};

// Method to flag feedback
feedbackSchema.methods.flagFeedback = function (userId, reason) {
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

// Static method to find feedback for a user
feedbackSchema.statics.findForUser = function (userId, options = {}) {
  const query = {
    toUserId: userId,
    isPublic: true,
    isFlagged: false,
  };

  if (options.rating) {
    query.rating = options.rating;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("fromUserId", "name avatar")
    .populate("sessionId", "scheduledTime duration");
};

// Static method to find average rating for a user
feedbackSchema.statics.getAverageRating = function (userId) {
  return this.aggregate([
    {
      $match: {
        toUserId: mongoose.Types.ObjectId(userId),
        isPublic: true,
        isFlagged: false,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalFeedback: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);
};

// Static method to find feedback by session
feedbackSchema.statics.findBySession = function (sessionId) {
  return this.find({ sessionId: sessionId })
    .populate("fromUserId", "name avatar")
    .populate("toUserId", "name avatar");
};

// Pre-save middleware for AI moderation
feedbackSchema.pre("save", function (next) {
  if (this.isModified("comment") && this.comment) {
    // This will be handled by the AI service integration
    this.aiModeration.isModerated = false;
  }
  next();
});

module.exports = mongoose.model("Feedback", feedbackSchema);
