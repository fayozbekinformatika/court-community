// web/src/context/SocketContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // We need to know if the user is logged in

// Define the shape of the context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Custom hook for easy access
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// The provider component
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get the authenticated user
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only try to connect if the user is authenticated
    if (user) {
      // 1. Create the new socket connection
      // Our backend is on port 5000 (as you set)
      const newSocket = io('https://court-community.onrender.com', {
  withCredentials: true,
  transports: ['websocket'],
  // Tokenni shu yerda yuboring:
  auth: {
    token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  }
});

      // 3. Set up event listeners
      newSocket.on('connect', () => {
        console.log('Socket.IO connected successfully!');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO disconnected.');
        setIsConnected(false);
      });

      // TODO: Add a listener for 'newMessage'

      setSocket(newSocket);

      // 4. Cleanup on component unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]); // This effect re-runs when the user logs in or out

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
