const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  authenticateToken,
  requireSessionParticipation,
} = require("../middleware/auth");
const Session = require("../models/Session");
const Swap = require("../models/Swap");
const User = require("../models/User");

const router = express.Router();

// Validation middleware
const validateSessionCreation = [
  body("swapId").isMongoId(),
  body("scheduledTime").isISO8601(),
  body("duration").isInt({ min: 15, max: 480 }),
  body("location").optional().trim(),
  body("notes.preSession").optional().trim().isLength({ max: 1000 }),
  body("meetingProvider")
    .optional()
    .isIn(["google-meet", "zoom", "teams", "custom"]),
];

const validateSessionUpdate = [
  body("status")
    .optional()
    .isIn(["scheduled", "in-progress", "completed", "cancelled", "no-show"]),
  body("meetingLink").optional().isURL(),
  body("location").optional().trim(),
  body("notes.preSession").optional().trim().isLength({ max: 1000 }),
  body("notes.postSession").optional().trim().isLength({ max: 1000 }),
  body("transcript").optional().trim(),
  body("summary").optional().trim(),
  body("aiGeneratedSummary").optional().trim(),
  body("recordingUrl").optional().isURL(),
];

// Create a new session
router.post(
  "/",
  authenticateToken,
  validateSessionCreation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      swapId,
      scheduledTime,
      duration,
      location,
      notes,
      meetingProvider = "google-meet",
    } = req.body;

    // Check if swap exists and user is participant
    const swap = await Swap.findById(swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(404).json({ error: "Swap not found or access denied" });
    }

    if (swap.status !== "accepted") {
      return res
        .status(400)
        .json({ error: "Swap must be accepted to create a session" });
    }

    // Check if session already exists for this swap
    const existingSession = await Session.findOne({ swapId });
    if (existingSession) {
      return res
        .status(400)
        .json({ error: "Session already exists for this swap" });
    }

    // Create session
    const session = new Session({
      swapId,
      requesterId: swap.requesterId,
      offererId: swap.offererId,
      scheduledTime: new Date(scheduledTime),
      duration,
      location,
      notes,
      meetingProvider,
    });

    await session.save();

    // Populate related data
    await session.populate("swapId");
    await session.populate("requesterId", "name avatar");
    await session.populate("offererId", "name avatar");

    res.status(201).json({
      message: "Session created successfully",
      session,
    });
  })
);

// Get all sessions for current user
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20, upcoming = false } = req.query;

    const query = {
      $or: [{ requesterId: req.user._id }, { offererId: req.user._id }],
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.scheduledTime = { $gte: new Date() };
      query.status = "scheduled";
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

// Get session by ID
router.get(
  "/:id",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    await req.session.populate("swapId");
    await req.session.populate("requesterId", "name avatar");
    await req.session.populate("offererId", "name avatar");

    res.json({ session: req.session });
  })
);

// Update session
router.put(
  "/:id",
  authenticateToken,
  requireSessionParticipation,
  validateSessionUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      meetingLink,
      location,
      notes,
      transcript,
      summary,
      aiGeneratedSummary,
      recordingUrl,
    } = req.body;

    // Update session fields
    if (status !== undefined) req.session.status = status;
    if (meetingLink !== undefined) req.session.meetingLink = meetingLink;
    if (location !== undefined) req.session.location = location;
    if (notes !== undefined) req.session.notes = notes;
    if (transcript !== undefined) req.session.transcript = transcript;
    if (summary !== undefined) req.session.summary = summary;
    if (aiGeneratedSummary !== undefined)
      req.session.aiGeneratedSummary = aiGeneratedSummary;
    if (recordingUrl !== undefined) req.session.recordingUrl = recordingUrl;

    await req.session.save();

    await req.session.populate("swapId");
    await req.session.populate("requesterId", "name avatar");
    await req.session.populate("offererId", "name avatar");

    res.json({
      message: "Session updated successfully",
      session: req.session,
    });
  })
);

// Start session
router.put(
  "/:id/start",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    if (req.session.status !== "scheduled") {
      return res
        .status(400)
        .json({ error: "Session is not in scheduled status" });
    }

    const started = req.session.startSession();
    if (!started) {
      return res.status(400).json({ error: "Failed to start session" });
    }

    await req.session.save();

    await req.session.populate("swapId");
    await req.session.populate("requesterId", "name avatar");
    await req.session.populate("offererId", "name avatar");

    res.json({
      message: "Session started successfully",
      session: req.session,
    });
  })
);

// End session
router.put(
  "/:id/end",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    if (req.session.status !== "in-progress") {
      return res.status(400).json({ error: "Session is not in progress" });
    }

    const ended = req.session.endSession();
    if (!ended) {
      return res.status(400).json({ error: "Failed to end session" });
    }

    await req.session.save();

    // Update swap status to completed
    await Swap.findByIdAndUpdate(req.session.swapId, { status: "completed" });

    // Update user statistics
    await User.findByIdAndUpdate(req.session.requesterId, {
      $inc: { totalSessions: 1 },
    });
    await User.findByIdAndUpdate(req.session.offererId, {
      $inc: { totalSessions: 1 },
    });

    await req.session.populate("swapId");
    await req.session.populate("requesterId", "name avatar");
    await req.session.populate("offererId", "name avatar");

    res.json({
      message: "Session ended successfully",
      session: req.session,
    });
  })
);

// Cancel session
router.put(
  "/:id/cancel",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    if (req.session.status !== "scheduled") {
      return res
        .status(400)
        .json({ error: "Session is not in scheduled status" });
    }

    const { reason } = req.body;

    const cancelled = req.session.cancelSession(req.user._id, reason);
    if (!cancelled) {
      return res.status(400).json({ error: "Failed to cancel session" });
    }

    await req.session.save();

    await req.session.populate("swapId");
    await req.session.populate("requesterId", "name avatar");
    await req.session.populate("offererId", "name avatar");

    res.json({
      message: "Session cancelled successfully",
      session: req.session,
    });
  })
);

// Join session (mark participant as joined)
router.put(
  "/:id/join",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    const participant = req.session.participants.find((p) =>
      p.userId.equals(req.user._id)
    );

    if (!participant) {
      req.session.participants.push({
        userId: req.user._id,
        joinedAt: new Date(),
      });
    } else if (!participant.joinedAt) {
      participant.joinedAt = new Date();
    }

    await req.session.save();

    res.json({
      message: "Joined session successfully",
      session: req.session,
    });
  })
);

// Leave session (mark participant as left)
router.put(
  "/:id/leave",
  authenticateToken,
  requireSessionParticipation,
  asyncHandler(async (req, res) => {
    const participant = req.session.participants.find((p) =>
      p.userId.equals(req.user._id)
    );

    if (participant && participant.joinedAt && !participant.leftAt) {
      participant.leftAt = new Date();
      participant.duration = Math.round(
        (participant.leftAt - participant.joinedAt) / (1000 * 60)
      ); // in minutes
    }

    await req.session.save();

    res.json({
      message: "Left session successfully",
      session: req.session,
    });
  })
);

// Get session statistics
router.get(
  "/stats/overview",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const stats = await Session.aggregate([
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

    const totalSessions = await Session.countDocuments({
      $or: [{ requesterId: userId }, { offererId: userId }],
    });

    const completedSessions = await Session.countDocuments({
      $or: [{ requesterId: userId }, { offererId: userId }],
      status: "completed",
    });

    const totalDuration = await Session.aggregate([
      {
        $match: {
          $or: [{ requesterId: userId }, { offererId: userId }],
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$duration" },
        },
      },
    ]);

    res.json({
      stats: {
        total: totalSessions,
        completed: completedSessions,
        totalDuration: totalDuration[0]?.totalMinutes || 0,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  })
);

// Get upcoming sessions
router.get(
  "/upcoming",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const sessions = await Session.findUpcomingForUser(req.user._id).limit(
      parseInt(limit)
    );

    res.json({ sessions });
  })
);

module.exports = router;
