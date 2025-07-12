const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  authenticateToken,
  requireSwapParticipation,
} = require("../middleware/auth");
const Swap = require("../models/Swap");
const User = require("../models/User");
const Session = require("../models/Session");

const router = express.Router();

// Validation middleware
const validateSwapCreation = [
  body("offererId").isMongoId(),
  body("skillOffered.name").trim().notEmpty(),
  body("skillOffered.proficiency").isIn([
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ]),
  body("skillRequested.name").trim().notEmpty(),
  body("skillRequested.proficiency").isIn([
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ]),
  body("description").trim().isLength({ min: 10, max: 1000 }),
  body("duration").optional().isInt({ min: 15, max: 480 }),
  body("scheduledTime").optional().isISO8601(),
  body("location").optional().trim(),
  body("tags").optional().isArray(),
  body("isUrgent").optional().isBoolean(),
  body("priority").optional().isIn(["low", "medium", "high"]),
];

const validateSwapUpdate = [
  body("status")
    .optional()
    .isIn(["pending", "accepted", "rejected", "completed", "cancelled"]),
  body("notes").optional().trim().isLength({ max: 500 }),
  body("scheduledTime").optional().isISO8601(),
  body("duration").optional().isInt({ min: 15, max: 480 }),
  body("location").optional().trim(),
  body("meetingLink").optional().isURL(),
  body("tags").optional().isArray(),
];

// Create a new swap request
router.post(
  "/",
  authenticateToken,
  validateSwapCreation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      offererId,
      skillOffered,
      skillRequested,
      description,
      duration = 60,
      scheduledTime,
      location,
      tags = [],
      isUrgent = false,
      priority = "medium",
    } = req.body;

    // Check if offerer exists and is active
    const offerer = await User.findById(offererId);
    if (!offerer || !offerer.canPerformAction()) {
      return res.status(404).json({ error: "Offerer not found or inactive" });
    }

    // Check if requester is trying to swap with themselves
    if (req.user._id.toString() === offererId) {
      return res
        .status(400)
        .json({ error: "Cannot create swap with yourself" });
    }

    // Check if there's already a pending swap between these users
    const existingSwap = await Swap.findOne({
      $or: [
        { requesterId: req.user._id, offererId: offererId },
        { requesterId: offererId, offererId: req.user._id },
      ],
      status: { $in: ["pending", "accepted"] },
    });

    if (existingSwap) {
      return res
        .status(400)
        .json({ error: "Active swap already exists between these users" });
    }

    // Create the swap
    const swap = new Swap({
      requesterId: req.user._id,
      offererId: offererId,
      skillOffered,
      skillRequested,
      description,
      duration,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      location,
      tags,
      isUrgent,
      priority,
    });

    await swap.save();

    // Populate user information
    await swap.populate("requesterId", "name avatar");
    await swap.populate("offererId", "name avatar");

    res.status(201).json({
      message: "Swap request created successfully",
      swap,
    });
  })
);

// Get all swaps (with filtering)
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      status,
      role = "all", // 'all', 'requester', 'offerer'
      page = 1,
      limit = 20,
      skill,
      isUrgent,
    } = req.query;

    // Build query
    const query = {};

    // Filter by user role
    if (role === "requester") {
      query.requesterId = req.user._id;
    } else if (role === "offerer") {
      query.offererId = req.user._id;
    } else {
      query.$or = [{ requesterId: req.user._id }, { offererId: req.user._id }];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by skill
    if (skill) {
      query.$or = [
        { "skillOffered.name": { $regex: skill, $options: "i" } },
        { "skillRequested.name": { $regex: skill, $options: "i" } },
      ];
    }

    // Filter by urgency
    if (isUrgent !== undefined) {
      query.isUrgent = isUrgent === "true";
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

// Get swap by ID
router.get(
  "/:id",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    await req.swap.populate("requesterId", "name avatar bio");
    await req.swap.populate("offererId", "name avatar bio");

    res.json({ swap: req.swap });
  })
);

// Update swap
router.put(
  "/:id",
  authenticateToken,
  requireSwapParticipation,
  validateSwapUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      notes,
      scheduledTime,
      duration,
      location,
      meetingLink,
      tags,
    } = req.body;

    // Check if swap can be modified
    if (!req.swap.canBeModified()) {
      return res
        .status(400)
        .json({ error: "Swap cannot be modified in its current state" });
    }

    // Update swap fields
    if (status !== undefined) req.swap.status = status;
    if (notes !== undefined) {
      if (req.swap.requesterId.equals(req.user._id)) {
        req.swap.notes.requester = notes;
      } else {
        req.swap.notes.offerer = notes;
      }
    }
    if (scheduledTime !== undefined)
      req.swap.scheduledTime = new Date(scheduledTime);
    if (duration !== undefined) req.swap.duration = duration;
    if (location !== undefined) req.swap.location = location;
    if (meetingLink !== undefined) req.swap.meetingLink = meetingLink;
    if (tags !== undefined) req.swap.tags = tags;

    await req.swap.save();

    // If swap is accepted, create a session
    if (status === "accepted" && req.swap.status === "accepted") {
      const session = new Session({
        swapId: req.swap._id,
        requesterId: req.swap.requesterId,
        offererId: req.swap.offererId,
        scheduledTime: req.swap.scheduledTime || new Date(),
        duration: req.swap.duration,
        location: req.swap.location,
      });

      await session.save();
    }

    await req.swap.populate("requesterId", "name avatar");
    await req.swap.populate("offererId", "name avatar");

    res.json({
      message: "Swap updated successfully",
      swap: req.swap,
    });
  })
);

// Accept swap
router.put(
  "/:id/accept",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    // Check if user is the offerer
    if (!req.swap.offererId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Only the offerer can accept the swap" });
    }

    if (req.swap.status !== "pending") {
      return res.status(400).json({ error: "Swap is not in pending status" });
    }

    req.swap.status = "accepted";
    await req.swap.save();

    // Create session
    const session = new Session({
      swapId: req.swap._id,
      requesterId: req.swap.requesterId,
      offererId: req.swap.offererId,
      scheduledTime: req.swap.scheduledTime || new Date(),
      duration: req.swap.duration,
      location: req.swap.location,
    });

    await session.save();

    await req.swap.populate("requesterId", "name avatar");
    await req.swap.populate("offererId", "name avatar");

    res.json({
      message: "Swap accepted successfully",
      swap: req.swap,
      session,
    });
  })
);

// Reject swap
router.put(
  "/:id/reject",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    // Check if user is the offerer
    if (!req.swap.offererId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Only the offerer can reject the swap" });
    }

    if (req.swap.status !== "pending") {
      return res.status(400).json({ error: "Swap is not in pending status" });
    }

    req.swap.status = "rejected";
    await req.swap.save();

    await req.swap.populate("requesterId", "name avatar");
    await req.swap.populate("offererId", "name avatar");

    res.json({
      message: "Swap rejected successfully",
      swap: req.swap,
    });
  })
);

// Complete swap
router.put(
  "/:id/complete",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    if (req.swap.status !== "accepted") {
      return res
        .status(400)
        .json({ error: "Swap must be accepted to be completed" });
    }

    req.swap.status = "completed";
    await req.swap.save();

    // Update user statistics
    await User.findByIdAndUpdate(req.swap.requesterId, {
      $inc: { completedSwaps: 1 },
    });
    await User.findByIdAndUpdate(req.swap.offererId, {
      $inc: { completedSwaps: 1 },
    });

    await req.swap.populate("requesterId", "name avatar");
    await req.swap.populate("offererId", "name avatar");

    res.json({
      message: "Swap completed successfully",
      swap: req.swap,
    });
  })
);

// Cancel swap
router.delete(
  "/:id",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    if (!req.swap.canBeModified()) {
      return res
        .status(400)
        .json({ error: "Swap cannot be cancelled in its current state" });
    }

    req.swap.status = "cancelled";
    req.swap.cancelledBy = req.user._id;
    req.swap.cancelReason = req.body.reason || "Cancelled by user";
    await req.swap.save();

    await req.swap.populate("requesterId", "name avatar");
    await req.swap.populate("offererId", "name avatar");

    res.json({
      message: "Swap cancelled successfully",
      swap: req.swap,
    });
  })
);

// Get swap statistics
router.get(
  "/stats/overview",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const stats = await Swap.aggregate([
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

    const totalSwaps = await Swap.countDocuments({
      $or: [{ requesterId: userId }, { offererId: userId }],
    });

    const completedSwaps = await Swap.countDocuments({
      $or: [{ requesterId: userId }, { offererId: userId }],
      status: "completed",
    });

    const pendingSwaps = await Swap.countDocuments({
      $or: [{ requesterId: userId }, { offererId: userId }],
      status: "pending",
    });

    res.json({
      stats: {
        total: totalSwaps,
        completed: completedSwaps,
        pending: pendingSwaps,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  })
);

// Get popular skills
router.get(
  "/stats/popular-skills",
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

module.exports = router;
