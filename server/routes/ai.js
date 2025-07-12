const express = require("express");
const { body, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticateToken } = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();

// Validation middleware
const validateModerationRequest = [
  body("content").trim().isLength({ min: 1, max: 5000 }),
  body("contentType").optional().isIn(["message", "feedback", "description"]),
];

const validateSummarizationRequest = [
  body("transcript").trim().isLength({ min: 10, max: 10000 }),
  body("sessionId").optional().isMongoId(),
  body("context").optional().trim(),
];

// Moderate content
router.post(
  "/moderate",
  authenticateToken,
  validateModerationRequest,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, contentType = "message" } = req.body;

    try {
      // Call external AI service for moderation
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await axios.post(
        `${aiServiceUrl}/moderate`,
        {
          content,
          contentType,
        },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      const { isSafe, categories, confidence, moderationResult } =
        response.data;

      res.json({
        isSafe,
        categories: categories || [],
        confidence: confidence || 0,
        moderationResult: moderationResult || "UNSAFE",
        moderatedAt: new Date(),
      });
    } catch (error) {
      console.error("AI moderation error:", error);

      // Fallback: basic keyword-based moderation
      const unsafeKeywords = [
        "hate",
        "violence",
        "harassment",
        "abuse",
        "spam",
        "scam",
        "inappropriate",
        "offensive",
        "discriminatory",
      ];

      const contentLower = content.toLowerCase();
      const hasUnsafeContent = unsafeKeywords.some((keyword) =>
        contentLower.includes(keyword)
      );

      res.json({
        isSafe: !hasUnsafeContent,
        categories: hasUnsafeContent ? ["basic_moderation"] : [],
        confidence: hasUnsafeContent ? 0.7 : 0.9,
        moderationResult: hasUnsafeContent ? "UNSAFE" : "SAFE",
        moderatedAt: new Date(),
        fallback: true,
      });
    }
  })
);

// Summarize session
router.post(
  "/summarize",
  authenticateToken,
  validateSummarizationRequest,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transcript, sessionId, context } = req.body;

    try {
      // Call external AI service for summarization
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await axios.post(
        `${aiServiceUrl}/summarize`,
        {
          transcript,
          sessionId,
          context,
        },
        {
          timeout: 30000, // 30 second timeout for summarization
        }
      );

      const { summary, keyPoints, actionItems, topics } = response.data;

      res.json({
        summary: summary || "",
        keyPoints: keyPoints || [],
        actionItems: actionItems || [],
        topics: topics || [],
        summarizedAt: new Date(),
      });
    } catch (error) {
      console.error("AI summarization error:", error);

      // Fallback: basic text summarization
      const sentences = transcript
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const summary = sentences.slice(0, 3).join(". ") + ".";

      res.json({
        summary,
        keyPoints: [],
        actionItems: [],
        topics: [],
        summarizedAt: new Date(),
        fallback: true,
      });
    }
  })
);

// Analyze user sentiment
router.post(
  "/sentiment",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    try {
      // Call external AI service for sentiment analysis
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await axios.post(
        `${aiServiceUrl}/sentiment`,
        {
          content,
        },
        {
          timeout: 10000,
        }
      );

      const { sentiment, confidence, emotions } = response.data;

      res.json({
        sentiment: sentiment || "neutral",
        confidence: confidence || 0,
        emotions: emotions || {},
        analyzedAt: new Date(),
      });
    } catch (error) {
      console.error("AI sentiment analysis error:", error);

      // Fallback: basic sentiment analysis
      const positiveWords = [
        "good",
        "great",
        "excellent",
        "amazing",
        "wonderful",
        "helpful",
      ];
      const negativeWords = [
        "bad",
        "terrible",
        "awful",
        "horrible",
        "useless",
        "waste",
      ];

      const contentLower = content.toLowerCase();
      const positiveCount = positiveWords.filter((word) =>
        contentLower.includes(word)
      ).length;
      const negativeCount = negativeWords.filter((word) =>
        contentLower.includes(word)
      ).length;

      let sentiment = "neutral";
      if (positiveCount > negativeCount) sentiment = "positive";
      else if (negativeCount > positiveCount) sentiment = "negative";

      res.json({
        sentiment,
        confidence: 0.6,
        emotions: {},
        analyzedAt: new Date(),
        fallback: true,
      });
    }
  })
);

// Generate skill recommendations
router.post(
  "/recommendations",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId, userSkills, interests, goals } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      // Call external AI service for recommendations
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await axios.post(
        `${aiServiceUrl}/recommendations`,
        {
          userId,
          userSkills: userSkills || [],
          interests: interests || [],
          goals: goals || [],
        },
        {
          timeout: 15000,
        }
      );

      const { recommendedSkills, reasoning, confidence } = response.data;

      res.json({
        recommendedSkills: recommendedSkills || [],
        reasoning: reasoning || "",
        confidence: confidence || 0,
        generatedAt: new Date(),
      });
    } catch (error) {
      console.error("AI recommendations error:", error);

      // Fallback: basic skill recommendations
      const commonSkills = [
        "JavaScript",
        "Python",
        "React",
        "Node.js",
        "MongoDB",
        "Cooking",
        "Photography",
        "Music",
        "Languages",
        "Fitness",
      ];

      const recommendedSkills = commonSkills
        .filter((skill) => !userSkills?.includes(skill))
        .slice(0, 5);

      res.json({
        recommendedSkills,
        reasoning: "Based on popular skills in the community",
        confidence: 0.5,
        generatedAt: new Date(),
        fallback: true,
      });
    }
  })
);

// Health check for AI service
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await axios.get(`${aiServiceUrl}/health`, {
        timeout: 5000,
      });

      res.json({
        status: "connected",
        aiService: response.data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("AI service health check failed:", error);

      res.json({
        status: "disconnected",
        error: error.message,
        timestamp: new Date(),
      });
    }
  })
);

// Get AI service configuration
router.get(
  "/config",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
      features: {
        moderation: true,
        summarization: true,
        sentiment: true,
        recommendations: true,
      },
      timeouts: {
        moderation: 10000,
        summarization: 30000,
        sentiment: 10000,
        recommendations: 15000,
      },
    });
  })
);

module.exports = router;
