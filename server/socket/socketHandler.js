const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Swap = require("../models/Swap");
const Session = require("../models/Session");

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("New WebSocket connection");

    // Authenticate WebSocket connection
    const token = socket.handshake.query.token;
    if (!token) {
      console.log("No token, disconnecting socket");
      return socket.disconnect();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user;

      const dbUser = await User.findById(socket.user.id);
      if (!dbUser) {
        console.log("User not found in DB, disconnecting socket");
        return socket.disconnect();
      }

      socket.userId = dbUser._id; // Attach actual user ID to socket
      console.log(
        `Socket authenticated for user: ${dbUser.name} (${dbUser._id})`
      );

      // Join user to a private room based on their user ID
      socket.join(socket.userId.toString());

      // Handle user joining swap rooms
      socket.on("joinSwap", async (swapId) => {
        try {
          const swap = await Swap.findById(swapId);

          if (!swap || !swap.isParticipant(socket.userId)) {
            socket.emit("error", { message: "Access denied to swap room" });
            return;
          }

          socket.join(`swap:${swapId}`);

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
            socket.emit("error", {
              message: "Access denied to update session",
            });
            return;
          }

          session.status = status;
          if (meetingLink) {
            session.meetingLink = meetingLink;
          }
          await session.save();

          io.to(`swap:${session.swapId}`).emit("sessionUpdated", {
            session: session.toObject(),
          });
        } catch (error) {
          console.error("Error updating session:", error);
          socket.emit("error", { message: "Failed to update session" });
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      socket.disconnect();
    }
  });

  // Helper functions for external use
  const emitToUser = (userId, event, data) => {
    // Emit to a specific user's private room
    io.to(userId.toString()).emit(event, data);
  };

  const emitToSwap = (swapId, event, data) => {
    io.to(`swap:${swapId}`).emit(event, data);
  };

  const emitToAll = (event, data) => {
    io.emit(event, data);
  };

  return {
    emitToUser,
    emitToSwap,
    emitToAll,
  };
};
