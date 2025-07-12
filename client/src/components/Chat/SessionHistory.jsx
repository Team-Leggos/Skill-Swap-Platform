import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import './styles.css';

const SessionHistory = ({ swapId, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [swapId]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getSessions({ swapId });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  const getSessionDuration = (startTime, endTime) => {
    if (!endTime) return 'Ongoing';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getSessionStatus = (session) => {
    if (!session.endTime) return 'active';
    if (session.status === 'completed') return 'completed';
    return 'ended';
  };

  return (
    <motion.div
      className="session-history-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="session-history-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {!selectedSession ? (
            <motion.div
              key="session-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="session-list-view"
            >
              {/* Header */}
              <div className="history-header">
                <h2>Session History</h2>
                <button className="close-btn" onClick={onClose}>
                  ✕
                </button>
              </div>

              {/* Sessions List */}
              <div className="sessions-content">
                {loading ? (
                  <div className="loading-sessions">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                    </div>
                    <p>Loading session history...</p>
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="sessions-list">
                    {sessions.map((session) => (
                      <motion.div
                        key={session._id}
                        className={`session-item ${getSessionStatus(session)}`}
                        onClick={() => handleSessionClick(session)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="session-info">
                          <div className="session-header-item">
                            <h4>Session {session.sessionNumber || sessions.indexOf(session) + 1}</h4>
                            <span className={`status-badge ${getSessionStatus(session)}`}>
                              {getSessionStatus(session)}
                            </span>
                          </div>
                          
                          <div className="session-meta">
                            <div className="meta-item">
                              <span className="meta-label">Date:</span>
                              <span className="meta-value">
                                {formatDateTime(session.startTime)}
                              </span>
                            </div>
                            
                            <div className="meta-item">
                              <span className="meta-label">Duration:</span>
                              <span className="meta-value">
                                {getSessionDuration(session.startTime, session.endTime)}
                              </span>
                            </div>
                            
                            {session.meetingLink && (
                              <div className="meta-item">
                                <span className="meta-label">Meeting:</span>
                                <a
                                  href={session.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="meeting-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Join/Rejoin 📞
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="session-arrow">→</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-history">
                    <div className="empty-icon">📋</div>
                    <h3>No sessions yet</h3>
                    <p>Start your first session to see it appear here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="session-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="session-detail-view"
            >
              {/* Header */}
              <div className="history-header">
                <button className="back-btn" onClick={handleBackToList}>
                  ← Back
                </button>
                <h2>Session Details</h2>
                <button className="close-btn" onClick={onClose}>
                  ✕
                </button>
              </div>

              {/* Session Details */}
              <div className="session-detail-content">
                <div className="detail-header">
                  <h3>Session {selectedSession.sessionNumber || 'Details'}</h3>
                  <span className={`status-badge ${getSessionStatus(selectedSession)}`}>
                    {getSessionStatus(selectedSession)}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="detail-card">
                    <h4>Session Information</h4>
                    <div className="detail-item">
                      <span className="detail-label">Started:</span>
                      <span className="detail-value">
                        {formatDateTime(selectedSession.startTime)}
                      </span>
                    </div>
                    
                    {selectedSession.endTime && (
                      <div className="detail-item">
                        <span className="detail-label">Ended:</span>
                        <span className="detail-value">
                          {formatDateTime(selectedSession.endTime)}
                        </span>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">
                        {getSessionDuration(selectedSession.startTime, selectedSession.endTime)}
                      </span>
                    </div>

                    {selectedSession.meetingLink && (
                      <div className="detail-item">
                        <span className="detail-label">Meeting Link:</span>
                        <a
                          href={selectedSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meeting-link"
                        >
                          Join Meeting 📞
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedSession.summary && (
                    <div className="detail-card">
                      <h4>Session Summary</h4>
                      <p className="summary-text">{selectedSession.summary}</p>
                    </div>
                  )}

                  {selectedSession.notes && (
                    <div className="detail-card">
                      <h4>Session Notes</h4>
                      <p className="notes-text">{selectedSession.notes}</p>
                    </div>
                  )}

                  {selectedSession.feedback && (
                    <div className="detail-card">
                      <h4>Feedback</h4>
                      <div className="feedback-content">
                        {selectedSession.feedback.rating && (
                          <div className="rating">
                            <span className="rating-label">Rating:</span>
                            <div className="stars">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`star ${i < selectedSession.feedback.rating ? 'filled' : ''}`}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedSession.feedback.comment && (
                          <p className="feedback-comment">
                            "{selectedSession.feedback.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedSession.chatHistory && selectedSession.chatHistory.length > 0 && (
                  <div className="chat-history-section">
                    <h4>Chat History</h4>
                    <div className="chat-messages">
                      {selectedSession.chatHistory.map((message, index) => (
                        <div key={index} className="history-message">
                          <div className="message-header">
                            <span className="sender-name">{message.senderName}</span>
                            <span className="message-timestamp">
                              {formatDateTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="message-content">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SessionHistory;