const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;
const userSockets = new Map();
const boardUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}.`);

    socket.on("register", (userId) => {
      userSockets.set(userId, socket.id);
      logger.info(`User ${userId} registered with socket ${socket.id}.`);
    });
    // --------------------------------------------------------------------
    socket.on("join-board", (boardId) => {
      socket.join(boardId);
      if (!boardUsers.has(boardId)) boardUsers.set(boardId, new Set());
      boardUsers.get(boardId).add(socket.id);
      logger.info(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on("draw", (data) => {
      const { boardId, ...stroke } = data;
      logger.info(
        `Received draw event on board ${boardId} from socket ${socket.id}`
      );
      socket.to(boardId).emit("draw", stroke);
    });
    // --------------------------------------------------------------------
    socket.on("disconnect", () => {
      for (let [userId, id] of userSockets.entries()) {
        if (id === socket.id) {
          userSockets.delete(userId);
          logger.info(`User ${userId} disconnected and unregistered.`);
          break;
        }
      }
      for (const [boardId, sockets] of boardUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          logger.info(`Socket ${socket.id} left board ${boardId}`);
          if (sockets.size === 0) boardUsers.delete(boardId);
        }
      }
    });
  });

  logger.info("Socket.io initialized.");
  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    getIO().to(socketId).emit(event, data);
  } else {
    logger.warn(`No active socket for user ${userId}.`);
  }
};

const broadcast = (event, data) => {
  getIO().emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  broadcast,
};
