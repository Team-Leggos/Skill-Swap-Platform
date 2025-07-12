const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  authenticateToken,
  requireSessionParticipation,
} = require("../middleware/auth");
const Feedback = require("../models/Feedback");
const Session = require("../models/Session");
const Swap = require("../models/Swap");
const User = require("../models/User");

const router = express.Router();

// Validation middleware
const validateFeedbackCreation = [
  body("sessionId").isMongoId(),
  body("toUserId").isMongoId(),
  body("rating").isInt({ min: 1, max: 5 }),
  body("comment").optional().trim().isLength({ max: 1000 }),
  body("categories").optional().isArray(),
  body("isAnonymous").optional().isBoolean(),
  body("isPublic").optional().isBoolean(),
];

const validateFeedbackUpdate = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("comment").optional().trim().isLength({ max: 1000 }),
  body("categories").optional().isArray(),
  body("isPublic").optional().isBoolean(),
];

// Create feedback
router.post(
  "/",
  authenticateToken,
  validateFeedbackCreation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      sessionId,
      toUserId,
      rating,
      comment,
      categories = [],
      isAnonymous = false,
      isPublic = true,
    } = req.body;

    // Check if session exists and user is participant
    const session = await Session.findById(sessionId);
    if (!session || !session.isParticipant(req.user._id)) {
      return res
        .status(404)
        .json({ error: "Session not found or access denied" });
    }

    // Check if session is completed
    if (session.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Can only provide feedback for completed sessions" });
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Check if user is trying to rate themselves
    if (req.user._id.toString() === toUserId) {
      return res
        .status(400)
        .json({ error: "Cannot provide feedback to yourself" });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      sessionId,
      fromUserId: req.user._id,
      toUserId,
    });

    if (existingFeedback) {
      return res
        .status(400)
        .json({ error: "Feedback already provided for this session" });
    }

    // Create feedback
    const feedback = new Feedback({
      sessionId,
      swapId: session.swapId,
      fromUserId: req.user._id,
      toUserId,
      rating,
      comment,
      categories,
      isAnonymous,
      isPublic,
    });

    await feedback.save();

    // Update user's average rating
    await updateUserRating(toUserId);

    // Populate related data
    await feedback.populate("fromUserId", "name avatar");
    await feedback.populate("toUserId", "name avatar");
    await feedback.populate("sessionId");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  })
);

// Get feedback for a session
router.get(
  "/session/:sessionId",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    const feedback = await Feedback.findBySession(req.params.sessionId);

    res.json({ feedback });
  })
);

// Get feedback for a user
router.get(
  "/user/:userId",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, rating } = req.query;

    const query = {
      toUserId: req.params.userId,
      isPublic: true,
      isFlagged: false,
    };

    if (rating) {
      query.rating = parseInt(rating);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find(query)
      .populate("fromUserId", "name avatar")
      .populate("sessionId", "scheduledTime duration")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Get user's own feedback
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find({ fromUserId: req.user._id })
      .populate("toUserId", "name avatar")
      .populate("sessionId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ fromUserId: req.user._id });

    res.json({
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Update feedback
router.put(
  "/:id",
  authenticateToken,
  validateFeedbackUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Check if user is the author
    if (!feedback.fromUserId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Only the author can edit feedback" });
    }

    const { rating, comment, categories, isPublic } = req.body;

    // Update feedback fields
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    if (categories !== undefined) feedback.categories = categories;
    if (isPublic !== undefined) feedback.isPublic = isPublic;

    await feedback.save();

    // Update user's average rating
    await updateUserRating(feedback.toUserId);

    await feedback.populate("fromUserId", "name avatar");
    await feedback.populate("toUserId", "name avatar");
    await feedback.populate("sessionId");

    res.json({
      message: "Feedback updated successfully",
      feedback,
    });
  })
);

// Delete feedback
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Check if user is the author or admin
    if (
      !feedback.fromUserId.equals(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only the author or admin can delete feedback" });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    // Update user's average rating
    await updateUserRating(feedback.toUserId);

    res.json({
      message: "Feedback deleted successfully",
    });
  })
);

// Add helpful vote to feedback
router.post(
  "/:id/helpful-vote",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { vote } = req.body; // 'helpful' or 'not_helpful'

    if (!vote || !["helpful", "not_helpful"].includes(vote)) {
      return res.status(400).json({ error: "Valid vote required" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const added = feedback.addHelpfulVote(req.user._id, vote);
    if (!added) {
      return res.status(400).json({ error: "Failed to add vote" });
    }

    await feedback.save();

    res.json({
      message: "Vote added successfully",
      feedback,
    });
  })
);

// Flag feedback
router.post(
  "/:id/flag",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const flagged = feedback.flagFeedback(req.user._id, reason);
    if (!flagged) {
      return res
        .status(400)
        .json({ error: "Feedback already flagged by this user" });
    }

    await feedback.save();

    res.json({
      message: "Feedback flagged successfully",
      feedback,
    });
  })
);

// Get feedback statistics for a user
router.get(
  "/user/:userId/stats",
  asyncHandler(async (req, res) => {
    const stats = await Feedback.getAverageRating(req.params.userId);

    res.json({
      stats: stats[0] || {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: [],
      },
    });
  })
);

// Get feedback statistics for current user
router.get(
  "/me/stats",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const stats = await Feedback.getAverageRating(req.user._id);

    res.json({
      stats: stats[0] || {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: [],
      },
    });
  })
);

// Helper function to update user's average rating
async function updateUserRating(userId) {
  const stats = await Feedback.getAverageRating(userId);
  const averageRating = stats[0]?.averageRating || 0;

  await User.findByIdAndUpdate(userId, { rating: averageRating });
}

module.exports = router;
