require("dotenv").config();

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // Attach full user object from DB (optional, depending on needs)
    req.user.profile = await User.findById(req.user.id).select("-password");

    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Middleware to require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    if (req.user.profile.role !== role && req.user.profile.role !== "admin") {
      return res.status(403).json({ msg: `Role '${role}' required` });
    }

    next();
  };
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Authentication required" });
  }

  if (req.user.profile.role !== "admin") {
    return res.status(403).json({ msg: "Admin access required" });
  }

  next();
};

module.exports = { auth, requireRole, requireAdmin };
