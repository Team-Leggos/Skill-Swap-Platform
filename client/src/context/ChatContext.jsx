import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({});
  const [activeChats, setActiveChats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const initializeSocket = () => {
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('message', (data) => {
      const { swapId, message } = data;
      setMessages(prev => ({
        ...prev,
        [swapId]: [...(prev[swapId] || []), message]
      }));
    });

    newSocket.on('swapUpdate', (data) => {
      // Handle swap status updates
      console.log('Swap update received:', data);
    });

    newSocket.on('sessionStart', (data) => {
      // Handle session start notifications
      console.log('Session started:', data);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const sendMessage = (swapId, content) => {
    if (socket && isConnected) {
      const messageData = {
        swapId,
        content,
        senderId: user._id,
        timestamp: new Date().toISOString()
      };

      socket.emit('message', messageData);
      
      // Optimistically add message to local state
      setMessages(prev => ({
        ...prev,
        [swapId]: [...(prev[swapId] || []), {
          ...messageData,
          _id: Date.now().toString() // Temporary ID
        }]
      }));
    }
  };

  const joinChat = (swapId) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', swapId);
      if (!activeChats.includes(swapId)) {
        setActiveChats(prev => [...prev, swapId]);
      }
    }
  };

  const leaveChat = (swapId) => {
    if (socket && isConnected) {
      socket.emit('leaveRoom', swapId);
      setActiveChats(prev => prev.filter(id => id !== swapId));
    }
  };

  const value = {
    socket,
    messages,
    activeChats,
    isConnected,
    sendMessage,
    joinChat,
    leaveChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};