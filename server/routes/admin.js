const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  authenticateToken,
  requireAdmin,
  requireModerator,
} = require("../middleware/auth");
const User = require("../models/User");
const Swap = require("../models/Swap");
const Session = require("../models/Session");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");

const router = express.Router();

// Validation middleware
const validateUserBan = [
  body("reason").trim().isLength({ min: 10, max: 200 }),
  body("duration").optional().isInt({ min: 1, max: 365 }), // days
];

const validateUserUpdate = [
  body("role").optional().isIn(["user", "moderator", "admin"]),
  body("isActive").optional().isBoolean(),
  body("isBanned").optional().isBoolean(),
];

// Get all users (admin only)
router.get(
  "/users",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      role,
      isActive,
      isBanned,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isBanned !== undefined) query.isBanned = isBanned === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Get user by ID (admin only)
router.get(
  "/users/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  })
);

// Update user (admin only)
router.put(
  "/users/:id",
  requireAdmin,
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { role, isActive, isBanned } = req.body;

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isBanned !== undefined) user.isBanned = isBanned;

    await user.save();

    res.json({
      message: "User updated successfully",
      user,
    });
  })
);

// Ban user (admin only)
router.post(
  "/users/:id/ban",
  requireAdmin,
  validateUserBan,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { reason, duration } = req.body;

    user.isBanned = true;
    user.banReason = reason;

    if (duration) {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + duration);
      user.banUntil = banUntil;
    }

    await user.save();

    res.json({
      message: "User banned successfully",
      user,
    });
  })
);

// Unban user (admin only)
router.post(
  "/users/:id/unban",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBanned = false;
    user.banReason = null;
    user.banUntil = null;

    await user.save();

    res.json({
      message: "User unbanned successfully",
      user,
    });
  })
);

// Get flagged messages (moderator+)
router.get(
  "/messages/flagged",
  requireModerator,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ isFlagged: true })
      .populate("senderId", "name avatar")
      .populate("swapId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ isFlagged: true });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Delete flagged message (moderator+)
router.delete(
  "/messages/:id",
  requireModerator,
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      message: "Message deleted successfully",
    });
  })
);

// Get flagged feedback (moderator+)
router.get(
  "/feedback/flagged",
  requireModerator,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find({ isFlagged: true })
      .populate("fromUserId", "name avatar")
      .populate("toUserId", "name avatar")
      .populate("sessionId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ isFlagged: true });

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

// Delete flagged feedback (moderator+)
router.delete(
  "/feedback/:id",
  requireModerator,
  asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    // Update user's average rating
    const stats = await Feedback.getAverageRating(feedback.toUserId);
    const averageRating = stats[0]?.averageRating || 0;
    await User.findByIdAndUpdate(feedback.toUserId, { rating: averageRating });

    res.json({
      message: "Feedback deleted successfully",
    });
  })
);

// Get system statistics (admin only)
router.get(
  "/stats",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalSwaps,
      completedSwaps,
      totalSessions,
      completedSessions,
      totalMessages,
      flaggedMessages,
      totalFeedback,
      flaggedFeedback,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, isBanned: false }),
      User.countDocuments({ isBanned: true }),
      Swap.countDocuments(),
      Swap.countDocuments({ status: "completed" }),
      Session.countDocuments(),
      Session.countDocuments({ status: "completed" }),
      Message.countDocuments(),
      Message.countDocuments({ isFlagged: true }),
      Feedback.countDocuments(),
      Feedback.countDocuments({ isFlagged: true }),
    ]);

    // Get recent activity
    const recentSwaps = await Swap.find()
      .populate("requesterId", "name")
      .populate("offererId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSessions = await Session.find()
      .populate("requesterId", "name")
      .populate("offererId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
        },
        swaps: {
          total: totalSwaps,
          completed: completedSwaps,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
        },
        content: {
          messages: {
            total: totalMessages,
            flagged: flaggedMessages,
          },
          feedback: {
            total: totalFeedback,
            flagged: flaggedFeedback,
          },
        },
      },
      recentActivity: {
        swaps: recentSwaps,
        sessions: recentSessions,
      },
    });
  })
);

// Get popular skills (admin only)
router.get(
  "/stats/popular-skills",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const popularOfferedSkills = await Swap.aggregate([
      {
        $match: { status: { $in: ["accepted", "completed"] } },
      },
      {
        $group: {
          _id: "$skillOffered.name",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const popularRequestedSkills = await Swap.aggregate([
      {
        $match: { status: { $in: ["accepted", "completed"] } },
      },
      {
        $group: {
          _id: "$skillRequested.name",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    res.json({
      offeredSkills: popularOfferedSkills,
      requestedSkills: popularRequestedSkills,
    });
  })
);

// Get user activity report (admin only)
router.get(
  "/users/:id/activity",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const [swaps, sessions, messages, feedback] = await Promise.all([
      Swap.find({
        $or: [{ requesterId: userId }, { offererId: userId }],
      }).countDocuments(),
      Session.find({
        $or: [{ requesterId: userId }, { offererId: userId }],
      }).countDocuments(),
      Message.find({ senderId: userId }).countDocuments(),
      Feedback.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      }).countDocuments(),
    ]);

    res.json({
      activity: {
        swaps,
        sessions,
        messages,
        feedback,
      },
    });
  })
);

// Get system logs (admin only)
router.get(
  "/logs",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type, page = 1, limit = 50 } = req.query;

    // This would typically connect to a logging service
    // For now, we'll return a placeholder
    res.json({
      logs: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0,
      },
    });
  })
);

module.exports = router;
