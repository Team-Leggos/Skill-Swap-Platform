import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';
import googleMeet from '../../services/googleMeet';
import SessionHistory from './SessionHistory';
import './styles.css';

const ChatBox = ({ swapId, otherUser, onClose }) => {
  const { user } = useAuth();
  const { messages, sendMessage, joinChat, leaveChat } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const swapMessages = messages[swapId] || [];

  useEffect(() => {
    joinChat(swapId);
    fetchMessages();
    
    return () => {
      leaveChat(swapId);
    };
  }, [swapId]);

  useEffect(() => {
    scrollToBottom();
  }, [swapMessages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(swapId);
      // Messages are handled by the ChatContext
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    sendMessage(swapId, newMessage.trim());
    setNewMessage('');
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleStartSession = async () => {
    try {
      toast.info('Starting Google Meet session...');
      
      const sessionData = {
        swapId,
        participants: [user._id, otherUser._id],
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour session
        skillOffered: 'Skill Session', // You might want to pass this from parent
        attendees: [
          { email: user.email, displayName: user.name },
          { email: otherUser.email, displayName: otherUser.name }
        ]
      };

      const result = await googleMeet.createMeetSession(sessionData);
      
      if (result.success) {
        // Send a message about the session
        sendMessage(swapId, `📞 Google Meet session started: ${result.meetLink}`);
        
        // Open the meet link
        googleMeet.openMeetSession(result.meetLink);
        
        toast.success('Google Meet session created and opened!');
      } else {
        // Fallback to simple meet link
        const simpleMeetLink = googleMeet.generateMeetLink();
        sendMessage(swapId, `📞 Session started: ${simpleMeetLink}`);
        googleMeet.openMeetSession(simpleMeetLink);
        
        toast.success('Session started with generated meet link!');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMyMessage = (message) => {
    return message.senderId === user._id;
  };

  return (
    <div className="chat-box">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.name} />
            ) : (
              <div className="avatar-placeholder">
                {otherUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="chat-user-details">
            <h3>{otherUser.name}</h3>
            <span className="online-status">Online</span>
          </div>
        </div>
        
        <div className="chat-actions">
          <motion.button
            className="action-btn session-btn"
            onClick={handleStartSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Start Google Meet Session"
          >
            📞
          </motion.button>
          
          <motion.button
            className="action-btn history-btn"
            onClick={() => setShowHistory(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="View Session History"
          >
            📋
          </motion.button>
          
          <motion.button
            className="action-btn close-btn"
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Close Chat"
          >
            ✕
          </motion.button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Loading messages...</p>
          </div>
        ) : swapMessages.length > 0 ? (
          <>
            {swapMessages.map((message, index) => (
              <motion.div
                key={message._id || index}
                className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-content">
                  <p>{message.content}</p>
                  <span className="message-time">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
                
                {!isMyMessage(message) && (
                  <div className="message-avatar">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} />
                    ) : (
                      <div className="avatar-placeholder small">
                        {otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                className="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>{otherUser.name} is typing...</p>
              </motion.div>
            )}
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <h3>Start the conversation!</h3>
            <p>Send a message to begin your skill exchange journey.</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="message-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            autoFocus
          />
          
          <motion.button
            type="submit"
            className="send-btn"
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="send-icon">➤</span>
          </motion.button>
        </div>
      </form>

      {/* Session History Modal */}
      {showHistory && (
        <SessionHistory
          swapId={swapId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default ChatBox;