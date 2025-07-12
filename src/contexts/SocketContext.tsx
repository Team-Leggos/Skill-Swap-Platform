import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  color: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  users: User[];
  sendMessage: (message: string) => void;
  updateSceneObject: (objectId: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([
    // Demo users for testing
    {
      id: 'demo-user-123',
      email: 'demo@example.com',
      color: '#00d9ff'
    },
    {
      id: 'demo-user-456',
      email: 'alice@example.com',
      color: '#ff6b6b'
    }
  ]);
  const { user, session } = useAuth();

  useEffect(() => {
    if (!user || !session) return;

    // Demo mode - simulate connection
    console.log('Socket.IO running in demo mode - backend not available');
    setConnected(true);
    toast.success('Connected to workspace (Demo Mode)');

    // Simulate real-time updates in demo mode
    const demoInterval = setInterval(() => {
      // Simulate occasional user activity
      if (Math.random() > 0.95) {
        const demoMessages = [
          'Welcome to the 3D workspace!',
          'Try clicking on the 3D objects',
          'This is a demo of real-time collaboration',
        ];
        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        window.dispatchEvent(new CustomEvent('chatMessage', { 
          detail: {
            userId: 'demo-user-456',
            email: 'alice@example.com',
            message: randomMessage,
            timestamp: Date.now(),
            color: '#ff6b6b'
          }
        }));
      }
    }, 5000);

    return () => {
      clearInterval(demoInterval);
      setConnected(false);
    };
  }, [user, session]);

  const sendMessage = (message: string) => {
    if (connected) {
      // Demo mode - simulate sending message
      window.dispatchEvent(new CustomEvent('chatMessage', { 
        detail: {
          userId: user?.id,
          email: user?.email,
          message,
          timestamp: Date.now(),
          color: '#00d9ff'
        }
      }));
    }
  };

  const updateSceneObject = (objectId: string, data: any) => {
    if (connected) {
      // Demo mode - simulate scene update
      console.log('Scene update (demo):', objectId, data);
    }
  };

  const value = {
    socket,
    connected,
    users,
    sendMessage,
    updateSceneObject,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}