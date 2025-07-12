import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { swapAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatBox from '../Chat/ChatBox';
import './styles.css';

const SwapDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSwapDetails();
    }
  }, [id]);

  const fetchSwapDetails = async () => {
    try {
      const response = await swapAPI.getSwapById(id);
      setSwap(response.data);
    } catch (error) {
      console.error('Error fetching swap details:', error);
      toast.error('Failed to load swap details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to request this swap');
      navigate('/login');
      return;
    }

    if (swap.user._id === user._id) {
      toast.error('You cannot request your own swap');
      return;
    }

    setRequesting(true);
    try {
      await swapAPI.acceptSwap(id);
      toast.success('Request sent successfully!');
      await fetchSwapDetails(); // Refresh data
    } catch (error) {
      console.error('Error requesting swap:', error);
      toast.error('Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  const handleChat = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to start chatting');
      navigate('/login');
      return;
    }
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="swap-details-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
          <div className="skeleton-sidebar"></div>
        </div>
      </div>
    );
  }

  if (!swap) {
    return (
      <div className="swap-details-container">
        <div className="error-state">
          <h2>Swap not found</h2>
          <p>The swap you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-details-container">
      <motion.div
        className="swap-details-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="details-header">
          <button
            onClick={() => navigate(-1)}
            className="back-button"
          >
            ← Back
          </button>
          
          <div className="status-badges">
            <span className={`status-badge ${swap.status}`}>
              {swap.status}
            </span>
            <span className="privacy-badge">
              {swap.privacy === 'private' ? '🔒 Private' : '🌍 Public'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="details-grid">
          <div className="main-content">
            <div className="skill-showcase">
              <div className="skill-card offered">
                <div className="skill-icon">🎓</div>
                <div className="skill-info">
                  <h2>{swap.skillOffered}</h2>
                  <p className="skill-type">Skill Offered</p>
                </div>
              </div>

              <div className="exchange-visual">
                <motion.div
                  className="exchange-arrow"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  ⇄
                </motion.div>
              </div>

              <div className="skill-card requested">
                <div className="skill-icon">🎯</div>
                <div className="skill-info">
                  <h2>{swap.skillRequested}</h2>
                  <p className="skill-type">Skill Requested</p>
                </div>
              </div>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{swap.description}</p>
            </div>

            <div className="details-grid-info">
              <div className="info-card">
                <h4>Category</h4>
                <p>{swap.category}</p>
              </div>
              
              <div className="info-card">
                <h4>Difficulty Level</h4>
                <p>{swap.difficultyLevel}</p>
              </div>
              
              <div className="info-card">
                <h4>Estimated Duration</h4>
                <p>{swap.estimatedDuration}</p>
              </div>
              
              <div className="info-card">
                <h4>Format</h4>
                <p>{swap.sessionFormat || 'Online'}</p>
              </div>
            </div>

            {swap.requirements && swap.requirements.length > 0 && (
              <div className="requirements-section">
                <h3>Requirements</h3>
                <ul>
                  {swap.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="user-card">
              <div className="user-avatar-large">
                {swap.user.avatar ? (
                  <img src={swap.user.avatar} alt={swap.user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {swap.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="user-info-detailed">
                <h3>{swap.user.name}</h3>
                {swap.user.bio && <p className="user-bio">{swap.user.bio}</p>}
                
                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-label">Skills Offered</span>
                    <span className="stat-value">
                      {swap.user.skillsOffered?.length || 0}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completed Swaps</span>
                    <span className="stat-value">
                      {swap.user.completedSwaps || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              {isAuthenticated && swap.user._id !== user._id ? (
                <>
                  <motion.button
                    className="request-btn primary"
                    onClick={handleRequest}
                    disabled={requesting || swap.status !== 'active'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {requesting ? (
                      <div className="btn-loading">
                        <div className="spinner"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <span>Request Swap</span>
                        <div className="btn-icon">🤝</div>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    className="request-btn secondary"
                    onClick={handleChat}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Start Chat</span>
                    <div className="btn-icon">💬</div>
                  </motion.button>
                </>
              ) : swap.user._id === user._id ? (
                <div className="owner-message">
                  <p>This is your swap listing</p>
                  <button className="edit-btn">Edit Swap</button>
                </div>
              ) : (
                <div className="auth-prompt">
                  <p>Please log in to interact with this swap</p>
                  <button 
                    className="login-prompt-btn"
                    onClick={() => navigate('/login')}
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>

            <div className="posted-info">
              <p>Posted {new Date(swap.createdAt).toLocaleDateString()}</p>
              {swap.updatedAt !== swap.createdAt && (
                <p>Updated {new Date(swap.updatedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Modal */}
      {showChat && (
        <motion.div
          className="chat-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowChat(false)}
        >
          <motion.div
            className="chat-modal"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChatBox 
              swapId={swap._id}
              otherUser={swap.user}
              onClose={() => setShowChat(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SwapDetails;