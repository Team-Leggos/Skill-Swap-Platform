const express = require("express");
const { query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticateToken, requireOwnership } = require("../middleware/auth");
const User = require("../models/User");
const Swap = require("../models/Swap");
const Session = require("../models/Session");
const Feedback = require("../models/Feedback");

const router = express.Router();

// Validation middleware
const validateUserSearch = [
  query("skill").optional().trim(),
  query("location").optional().trim(),
  query("rating").optional().isFloat({ min: 0, max: 5 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];

// Get all users (with search and filtering)
router.get(
  "/",
  validateUserSearch,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      skill,
      location,
      rating,
      page = 1,
      limit = 20,
      sortBy = "rating",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {
      isActive: true,
      isBanned: false,
    };

    if (skill) {
      query.$or = [
        { "skillsOffered.name": { $regex: skill, $options: "i" } },
        { "skillsWanted.name": { $regex: skill, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-email -supabaseId -isBanned -banReason -preferences")
      .sort(sort)
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

// Get user by ID (public profile)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(
      "-email -supabaseId -isBanned -banReason -preferences"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isActive || user.isBanned) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: user.getPublicProfile() });
  })
);

// Get current user's profile
router.get(
  "/me/profile",
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

// Update current user's profile
router.put(
  "/me/profile",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      name,
      bio,
      avatar,
      skillsOffered,
      skillsWanted,
      location,
      timezone,
      preferences,
    } = req.body;

    // Update user fields
    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (avatar !== undefined) req.user.avatar = avatar;
    if (skillsOffered !== undefined) req.user.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) req.user.skillsWanted = skillsWanted;
    if (location !== undefined) req.user.location = location;
    if (timezone !== undefined) req.user.timezone = timezone;
    if (preferences !== undefined) req.user.preferences = preferences;

    await req.user.save();

    res.json({
      message: "Profile updated successfully",
      user: req.user,
    });
  })
);

// Get user's swap history
router.get(
  "/me/swaps",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [{ requesterId: req.user._id }, { offererId: req.user._id }],
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await Swap.find(query)
      .populate("requesterId", "name avatar")
      .populate("offererId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Swap.countDocuments(query);

    res.json({
      swaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Get user's session history
router.get(
  "/me/sessions",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [{ requesterId: req.user._id }, { offererId: req.user._id }],
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(query)
      .populate("swapId")
      .populate("requesterId", "name avatar")
      .populate("offererId", "name avatar")
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Get user's feedback/reviews
router.get(
  "/me/feedback",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find({ toUserId: req.user._id })
      .populate("fromUserId", "name avatar")
      .populate("sessionId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ toUserId: req.user._id });

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

// Get user's statistics
router.get(
  "/me/stats",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get swap statistics
    const swapStats = await Swap.aggregate([
      {
        $match: {
          $or: [{ requesterId: userId }, { offererId: userId }],
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get session statistics
    const sessionStats = await Session.aggregate([
      {
        $match: {
          $or: [{ requesterId: userId }, { offererId: userId }],
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get feedback statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $match: { toUserId: userId },
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

    // Get skills statistics
    const skillsOfferedCount = req.user.skillsOffered.length;
    const skillsWantedCount = req.user.skillsWanted.length;

    res.json({
      stats: {
        swaps: swapStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        sessions: sessionStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        feedback: feedbackStats[0] || {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: [],
        },
        skills: {
          offered: skillsOfferedCount,
          wanted: skillsWantedCount,
        },
      },
    });
  })
);

// Get user's public profile with additional info
router.get(
  "/:id/public",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(
      "-email -supabaseId -isBanned -banReason -preferences"
    );

    if (!user || !user.isActive || user.isBanned) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's feedback statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $match: {
          toUserId: user._id,
          isPublic: true,
          isFlagged: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 },
        },
      },
    ]);

    // Get recent feedback
    const recentFeedback = await Feedback.find({
      toUserId: user._id,
      isPublic: true,
      isFlagged: false,
    })
      .populate("fromUserId", "name avatar")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user: user.getPublicProfile(),
      stats: {
        averageRating: feedbackStats[0]?.averageRating || 0,
        totalFeedback: feedbackStats[0]?.totalFeedback || 0,
        completedSwaps: user.completedSwaps,
        totalSessions: user.totalSessions,
      },
      recentFeedback,
    });
  })
);

// Search users by skill
router.get(
  "/search/skill/:skill",
  asyncHandler(async (req, res) => {
    const { skill } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.findBySkill(skill, {
      limit: parseInt(limit),
      skip,
    });

    const total = await User.countDocuments({
      isActive: true,
      isBanned: false,
      $or: [
        { "skillsOffered.name": { $regex: skill, $options: "i" } },
        { "skillsWanted.name": { $regex: skill, $options: "i" } },
      ],
    });

    res.json({
      users: users.map((user) => user.getPublicProfile()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

module.exports = router;
