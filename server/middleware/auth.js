const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const User = require("../models/User");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Find user in our database
    const dbUser = await User.findOne({ supabaseId: user.id });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    if (!dbUser.canPerformAction()) {
      return res
        .status(403)
        .json({ error: "User account is disabled or banned" });
    }

    // Attach user to request object
    req.user = dbUser;
    req.supabaseUser = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ error: `Role '${role}' required` });
    }

    next();
  };
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Middleware to require moderator or admin role
const requireModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["admin", "moderator"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: "Moderator or admin access required" });
  }

  next();
};

// Middleware to check if user owns resource or is admin
const requireOwnership = (resourceField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceField] || req.body[resourceField];

    if (!resourceUserId) {
      return res.status(400).json({ error: "Resource user ID required" });
    }

    if (resourceUserId !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Access denied: resource ownership required" });
    }

    next();
  };
};

// Middleware to check if user is participant in swap
const requireSwapParticipation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const swapId = req.params.swapId || req.body.swapId;

    if (!swapId) {
      return res.status(400).json({ error: "Swap ID required" });
    }

    const Swap = require("../models/Swap");
    const swap = await Swap.findById(swapId);

    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }

    if (!swap.isParticipant(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Access denied: swap participation required" });
    }

    req.swap = swap;
    next();
  } catch (error) {
    console.error("Swap participation check error:", error);
    return res
      .status(500)
      .json({ error: "Failed to verify swap participation" });
  }
};

// Middleware to check if user is participant in session
const requireSessionParticipation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const sessionId = req.params.sessionId || req.body.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const Session = require("../models/Session");
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.isParticipant(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Access denied: session participation required" });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error("Session participation check error:", error);
    return res
      .status(500)
      .json({ error: "Failed to verify session participation" });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireModerator,
  requireOwnership,
  requireSwapParticipation,
  requireSessionParticipation,
};
