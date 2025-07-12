import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatTimeAgo, truncateText } from "../../utils/helpers";
import "./styles.css";

const SwapCard = ({ swap }) => {
  const {
    _id,
    skillOffered,
    skillRequested,
    description,
    user,
    category,
    difficultyLevel,
    estimatedDuration,
    createdAt,
    privacy,
  } = swap;

  const categoryIcons = {
    Technology: "💻",
    Creative: "🎨",
    Lifestyle: "🏃‍♀️",
    Business: "💼",
    Languages: "🗣️",
    Music: "🎵",
    Sports: "⚽",
    Cooking: "👨‍🍳",
  };

  const difficultyColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  };

  return (
    <motion.div
      className="swap-card card-3d"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="card-header">
        <div className="category-badge">
          <span className="category-icon">
            {categoryIcons[category] || "📚"}
          </span>
          <span className="category-name">{category}</span>
        </div>
        <div className="privacy-indicator">
          {privacy === "private" ? "🔒" : "🌍"}
        </div>
      </div>

      <div className="card-content">
        <div className="skill-exchange">
          <div className="skill-offered">
            <h3 className="skill-title">{skillOffered}</h3>
            <div className="skill-label">Offering</div>
          </div>

          <div className="exchange-arrow">
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="arrow-icon"
            >
              ⇄
            </motion.div>
          </div>

          <div className="skill-requested">
            <h3 className="skill-title">{skillRequested}</h3>
            <div className="skill-label">Looking for</div>
          </div>
        </div>

        <p className="description">{truncateText(description, 120)}</p>

        <div className="card-meta">
          <div className="meta-row">
            <div
              className={`difficulty-badge ${
                difficultyColors[difficultyLevel] || "bg-gray-100 text-gray-800"
              }`}
            >
              {difficultyLevel}
            </div>
            <div className="duration-badge">⏱️ {estimatedDuration}</div>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="post-time">{formatTimeAgo(createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <Link to={`/swap/${_id}`} className="view-swap-btn">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-content"
          >
            <span>View Details</span>
            <div className="btn-arrow">→</div>
          </motion.div>
        </Link>
      </div>

      {/* Floating elements for visual appeal */}
      <div className="card-glow"></div>
      <div className="floating-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>
    </motion.div>
  );
};

export default SwapCard;
