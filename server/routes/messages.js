const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  authenticateToken,
  requireSwapParticipation,
} = require("../middleware/auth");
const Message = require("../models/Message");
const Swap = require("../models/Swap");

const router = express.Router();

// Validation middleware
const validateMessageCreation = [
  body("swapId").isMongoId(),
  body("content").trim().isLength({ min: 1, max: 2000 }),
  body("messageType").optional().isIn(["text", "image", "file", "system"]),
  body("fileUrl").optional().isURL(),
  body("fileName").optional().trim(),
  body("fileSize").optional().isInt({ min: 1 }),
];

const validateMessageUpdate = [
  body("content").trim().isLength({ min: 1, max: 2000 }),
];

// Get messages for a swap
router.get(
  "/swap/:swapId",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.findBySwapId(req.params.swapId, {
      limit: parseInt(limit),
      skip,
    });

    const total = await Message.countDocuments({
      swapId: req.params.swapId,
      isDeleted: false,
    });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Create a new message
router.post(
  "/",
  authenticateToken,
  validateMessageCreation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      swapId,
      content,
      messageType = "text",
      fileUrl,
      fileName,
      fileSize,
    } = req.body;

    // Check if swap exists and user is participant
    const swap = await Swap.findById(swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(404).json({ error: "Swap not found or access denied" });
    }

    // Create message
    const message = new Message({
      swapId,
      senderId: req.user._id,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
    });

    await message.save();

    // Populate sender info
    await message.populate("senderId", "name avatar");

    res.status(201).json({
      message: "Message sent successfully",
      messageData: message,
    });
  })
);

// Update message
router.put(
  "/:id",
  authenticateToken,
  validateMessageUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender
    if (!message.senderId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Only the sender can edit the message" });
    }

    // Check if message can be edited (not deleted and not too old)
    if (message.isDeleted) {
      return res.status(400).json({ error: "Cannot edit deleted message" });
    }

    const timeDiff = Date.now() - message.createdAt.getTime();
    const maxEditTime = 5 * 60 * 1000; // 5 minutes
    if (timeDiff > maxEditTime) {
      return res
        .status(400)
        .json({ error: "Message can only be edited within 5 minutes" });
    }

    const { content } = req.body;
    const edited = message.editMessage(content);
    if (!edited) {
      return res.status(400).json({ error: "Failed to edit message" });
    }

    await message.save();
    await message.populate("senderId", "name avatar");

    res.json({
      message: "Message updated successfully",
      messageData: message,
    });
  })
);

// Delete message
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender or admin
    if (!message.senderId.equals(req.user._id) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only the sender or admin can delete the message" });
    }

    const deleted = message.deleteMessage(req.user._id);
    if (!deleted) {
      return res.status(400).json({ error: "Failed to delete message" });
    }

    await message.save();

    res.json({
      message: "Message deleted successfully",
      messageData: message,
    });
  })
);

// Mark message as read
router.put(
  "/:id/read",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is participant in the swap
    const swap = await Swap.findById(message.swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const marked = message.markAsRead(req.user._id);
    if (marked) {
      await message.save();
    }

    res.json({
      message: "Message marked as read",
      messageId: message._id,
    });
  })
);

// Add reaction to message
router.post(
  "/:id/reactions",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is participant in the swap
    const swap = await Swap.findById(message.swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const added = message.addReaction(req.user._id, emoji);
    if (!added) {
      return res.status(400).json({ error: "Reaction already exists" });
    }

    await message.save();

    res.json({
      message: "Reaction added successfully",
      messageData: message,
    });
  })
);

// Remove reaction from message
router.delete(
  "/:id/reactions/:emoji",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { emoji } = req.params;

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is participant in the swap
    const swap = await Swap.findById(message.swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const removed = message.removeReaction(req.user._id, emoji);
    if (!removed) {
      return res.status(400).json({ error: "Reaction not found" });
    }

    await message.save();

    res.json({
      message: "Reaction removed successfully",
      messageData: message,
    });
  })
);

// Flag message
router.post(
  "/:id/flag",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is participant in the swap
    const swap = await Swap.findById(message.swapId);
    if (!swap || !swap.isParticipant(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const flagged = message.flagMessage(req.user._id, reason);
    if (!flagged) {
      return res
        .status(400)
        .json({ error: "Message already flagged by this user" });
    }

    await message.save();

    res.json({
      message: "Message flagged successfully",
      messageData: message,
    });
  })
);

// Get unread message count for a swap
router.get(
  "/swap/:swapId/unread",
  authenticateToken,
  requireSwapParticipation,
  asyncHandler(async (req, res) => {
    const count = await Message.findUnreadForUser(
      req.user._id,
      req.params.swapId
    );

    res.json({
      unreadCount: count,
    });
  })
);

// Get recent messages for user
router.get(
  "/recent",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    // Get user's swaps
    const swaps = await Swap.find({
      $or: [{ requesterId: req.user._id }, { offererId: req.user._id }],
      status: { $in: ["pending", "accepted"] },
    });

    const swapIds = swaps.map((swap) => swap._id);

    // Get recent messages from these swaps
    const messages = await Message.find({
      swapId: { $in: swapIds },
      senderId: { $ne: req.user._id },
      isDeleted: false,
    })
      .populate("senderId", "name avatar")
      .populate("swapId", "skillOffered skillRequested")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages });
  })
);

module.exports = router;
