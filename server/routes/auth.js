const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { body, validationResult } = require("express-validator");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation middleware
const validateUserRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("name").trim().isLength({ min: 2, max: 100 }),
  body("password").isLength({ min: 6 }),
  body("skillsOffered").isArray().optional(),
  body("skillsWanted").isArray().optional(),
];

const validateUserUpdate = [
  body("name").trim().isLength({ min: 2, max: 100 }).optional(),
  body("bio").trim().isLength({ max: 500 }).optional(),
  body("skillsOffered").isArray().optional(),
  body("skillsWanted").isArray().optional(),
  body("location").trim().optional(),
  body("timezone").trim().optional(),
];

// Register new user
router.post(
  "/register",
  validateUserRegistration,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      name,
      skillsOffered = [],
      skillsWanted = [],
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user in Supabase
    const {
      data: { user },
      error: supabaseError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (supabaseError) {
      return res.status(400).json({ error: supabaseError.message });
    }

    // Create user in our database
    const newUser = new User({
      supabaseId: user.id,
      email: user.email,
      name: name,
      skillsOffered,
      skillsWanted,
    });

    await newUser.save();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.getPublicProfile(),
      session: session,
    });
  })
);

// Login user
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in with Supabase
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid credentials" });
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

    res.json({
      message: "Login successful",
      user: dbUser.getPublicProfile(),
      session: session,
    });
  })
);

// Logout user
router.post(
  "/logout",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.json({ message: "Logout successful" });
  })
);

// Get current user profile
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      user: req.user.getPublicProfile(),
    });
  })
);

// Update user profile
router.put(
  "/me",
  authenticateToken,
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
      user: req.user.getPublicProfile(),
    });
  })
);

// Refresh token
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    res.json({
      session: session,
    });
  })
);

// Forgot password
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });

    if (error) {
      return res.status(500).json({ error: "Failed to send reset email" });
    }

    res.json({ message: "Password reset email sent" });
  })
);

// Reset password
router.post(
  "/reset-password",
  [body("password").isLength({ min: 6 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return res.status(500).json({ error: "Failed to reset password" });
    }

    res.json({ message: "Password reset successfully" });
  })
);

// Delete account
router.delete(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Delete from Supabase
    const { error: supabaseError } = await supabase.auth.admin.deleteUser(
      req.supabaseUser.id
    );

    if (supabaseError) {
      return res
        .status(500)
        .json({ error: "Failed to delete account from Supabase" });
    }

    // Delete from our database
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Account deleted successfully" });
  })
);

module.exports = router;
