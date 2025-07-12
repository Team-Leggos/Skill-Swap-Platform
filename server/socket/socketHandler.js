const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const User = require("../models/User");
const Message = require("../models/Message");
const Swap = require("../models/Swap");
const Session = require("../models/Session");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Store connected users
const connectedUsers = new Map();
const userRooms = new Map();

module.exports = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error("Authentication error: Invalid token"));
      }

      // Find user in database
      const dbUser = await User.findOne({ supabaseId: user.id });

      if (!dbUser) {
        return next(new Error("Authentication error: User not found"));
      }

      if (!dbUser.canPerformAction()) {
        return next(new Error("Authentication error: User account disabled"));
      }

      socket.userId = dbUser._id.toString();
      socket.supabaseId = user.id;
      socket.user = dbUser;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date(),
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle user joining swap rooms
    socket.on("joinSwap", async (swapId) => {
      try {
        const swap = await Swap.findById(swapId);

        if (!swap || !swap.isParticipant(socket.userId)) {
          socket.emit("error", { message: "Access denied to swap room" });
          return;
        }

        socket.join(`swap:${swapId}`);

        // Store user's rooms
        if (!userRooms.has(socket.userId)) {
          userRooms.set(socket.userId, new Set());
        }
        userRooms.get(socket.userId).add(`swap:${swapId}`);

        socket.emit("joinedSwap", { swapId });

        // Notify other participants
        socket.to(`swap:${swapId}`).emit("userJoinedSwap", {
          swapId,
          userId: socket.userId,
          userName: socket.user.name,
        });
      } catch (error) {
        console.error("Error joining swap room:", error);
        socket.emit("error", { message: "Failed to join swap room" });
      }
    });

    // Handle user leaving swap rooms
    socket.on("leaveSwap", (swapId) => {
      socket.leave(`swap:${swapId}`);

      if (userRooms.has(socket.userId)) {
        userRooms.get(socket.userId).delete(`swap:${swapId}`);
      }

      socket.to(`swap:${swapId}`).emit("userLeftSwap", {
        swapId,
        userId: socket.userId,
        userName: socket.user.name,
      });
    });

    // Handle new message
    socket.on("message", async (data) => {
      try {
        const {
          swapId,
          content,
          messageType = "text",
          fileUrl = null,
          fileName = null,
          fileSize = null,
        } = data;

        // Validate swap participation
        const swap = await Swap.findById(swapId);
        if (!swap || !swap.isParticipant(socket.userId)) {
          socket.emit("error", { message: "Access denied to send message" });
          return;
        }

        // Create message
        const message = new Message({
          swapId,
          senderId: socket.userId,
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
        });

        await message.save();

        // Populate sender info
        await message.populate("senderId", "name avatar");

        // Emit to swap room
        io.to(`swap:${swapId}`).emit("newMessage", {
          message: message.toObject(),
          swapId,
        });

        // Emit to other participants' personal rooms for notifications
        const otherParticipant = swap.getOtherParticipant(socket.userId);
        if (otherParticipant) {
          io.to(`user:${otherParticipant}`).emit("newMessageNotification", {
            swapId,
            message: {
              id: message._id,
              content: message.content,
              senderName: socket.user.name,
              createdAt: message.createdAt,
            },
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", async (data) => {
      try {
        const { swapId, isTyping } = data;

        // Validate swap participation
        const swap = await Swap.findById(swapId);
        if (!swap || !swap.isParticipant(socket.userId)) {
          return;
        }

        // Emit to other participants in the swap room
        socket.to(`swap:${swapId}`).emit("userTyping", {
          swapId,
          userId: socket.userId,
          userName: socket.user.name,
          isTyping,
        });
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    });

    // Handle message read
    socket.on("messageRead", async (data) => {
      try {
        const { messageId, swapId } = data;

        const message = await Message.findById(messageId);
        if (!message || message.swapId.toString() !== swapId) {
          return;
        }

        // Mark as read
        const marked = message.markAsRead(socket.userId);
        if (marked) {
          await message.save();

          // Emit read receipt to swap room
          io.to(`swap:${swapId}`).emit("messageRead", {
            messageId,
            userId: socket.userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Handle swap status updates
    socket.on("swapUpdate", async (data) => {
      try {
        const { swapId, status, notes } = data;

        const swap = await Swap.findById(swapId);
        if (!swap || !swap.isParticipant(socket.userId)) {
          socket.emit("error", { message: "Access denied to update swap" });
          return;
        }

        // Update swap status
        swap.status = status;
        if (notes) {
          if (swap.requesterId.equals(socket.userId)) {
            swap.notes.requester = notes;
          } else {
            swap.notes.offerer = notes;
          }
        }

        await swap.save();

        // Emit to swap room
        io.to(`swap:${swapId}`).emit("swapUpdated", {
          swap: swap.toObject(),
          updatedBy: socket.userId,
        });

        // If swap is accepted, create session
        if (status === "accepted") {
          const session = new Session({
            swapId: swap._id,
            requesterId: swap.requesterId,
            offererId: swap.offererId,
            scheduledTime: swap.scheduledTime || new Date(),
            duration: swap.duration,
          });

          await session.save();

          // Emit session created event
          io.to(`swap:${swapId}`).emit("sessionCreated", {
            session: session.toObject(),
          });
        }
      } catch (error) {
        console.error("Error updating swap:", error);
        socket.emit("error", { message: "Failed to update swap" });
      }
    });

    // Handle session updates
    socket.on("sessionUpdate", async (data) => {
      try {
        const { sessionId, status, meetingLink } = data;

        const session = await Session.findById(sessionId);
        if (!session || !session.isParticipant(socket.userId)) {
          socket.emit("error", { message: "Access denied to update session" });
          return;
        }

        // Update session
        if (status) session.status = status;
        if (meetingLink) session.meetingLink = meetingLink;

        await session.save();

        // Emit to swap room
        io.to(`swap:${session.swapId}`).emit("sessionUpdated", {
          session: session.toObject(),
          updatedBy: socket.userId,
        });
      } catch (error) {
        console.error("Error updating session:", error);
        socket.emit("error", { message: "Failed to update session" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Leave all rooms
      if (userRooms.has(socket.userId)) {
        const rooms = userRooms.get(socket.userId);
        rooms.forEach((room) => {
          socket.to(room).emit("userDisconnected", {
            userId: socket.userId,
            userName: socket.user.name,
          });
        });
        userRooms.delete(socket.userId);
      }
    });
  });

  // Helper functions for external use
  const emitToUser = (userId, event, data) => {
    const userData = connectedUsers.get(userId);
    if (userData) {
      io.to(userData.socketId).emit(event, data);
    }
  };

  const emitToSwap = (swapId, event, data) => {
    io.to(`swap:${swapId}`).emit(event, data);
  };

  const emitToAll = (event, data) => {
    io.emit(event, data);
  };

  // Return helper functions
  return {
    emitToUser,
    emitToSwap,
    emitToAll,
    connectedUsers,
    userRooms,
  };
};
