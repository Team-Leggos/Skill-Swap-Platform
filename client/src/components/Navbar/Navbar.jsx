import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowProfileMenu(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/dashboard", label: "Dashboard", icon: "📊", auth: true },
    { path: "/requests", label: "Requests", icon: "📋", auth: true },
    { path: "/profile", label: "Profile", icon: "👤", auth: true },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-3d">
            <span className="logo-text">SkillSwap</span>
            <div className="logo-glow"></div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {navItems.map((item) => {
            if (item.auth && !isAuthenticated) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  isActivePath(item.path) ? "active" : ""
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActivePath(item.path) && (
                  <motion.div
                    className="nav-indicator"
                    layoutId="navbar-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <button
                className="user-avatar"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="avatar-ring">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <span className="user-name">{user?.name}</span>
                <motion.div
                  className="dropdown-arrow"
                  animate={{ rotate: showProfileMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    className="profile-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <span className="dropdown-icon">👤</span>
                      My Profile
                    </Link>
                    <Link
                      to="/requests"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <span className="dropdown-icon">📋</span>
                      My Requests
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn">
                Login
              </Link>
              <Link to="/signup" className="auth-btn signup-btn">
                <span>Sign Up</span>
                <div className="btn-glow"></div>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <motion.div
            className="hamburger"
            animate={isMenuOpen ? "open" : "closed"}
          >
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 5 },
              }}
            />
            <motion.span
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 },
              }}
            />
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -5 },
              }}
            />
          </motion.div>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navItems.map((item) => {
              if (item.auth && !isAuthenticated) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${
                    isActivePath(item.path) ? "active" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}

            {!isAuthenticated && (
              <div className="mobile-auth">
                <Link
                  to="/login"
                  className="mobile-auth-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="mobile-auth-link signup"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
