const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;
const userSockets = new Map();
const boardUsers = new Map();
const boardCursors = new Map();

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

    socket.on("join-board", (boardId) => {
      socket.join(boardId);
      if (!boardUsers.has(boardId)) boardUsers.set(boardId, new Set());
      boardUsers.get(boardId).add(socket.id);
      if (!boardCursors.has(boardId)) boardCursors.set(boardId, new Map());

      logger.info(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on("draw", (data) => {
      const { boardId, ...stroke } = data;
      logger.info(
        `Received draw event on board ${boardId} from socket ${socket.id}`
      );
      socket.to(boardId).emit("draw", stroke);
    });

    socket.on("cursor-move", (data) => {
      const { boardId, userId, userName, x, y } = data;

      if (boardCursors.has(boardId)) {
        boardCursors.get(boardId).set(userId, { userName, x, y });
      }
      socket.to(boardId).emit("cursor-update", { userId, userName, x, y });
    });

    socket.on("cursor-leave", (data) => {
      const { boardId, userId } = data;
      if (boardCursors.has(boardId)) {
        boardCursors.get(boardId).delete(userId);
      }
      socket.to(boardId).emit("cursor-remove", { userId });

      logger.info(`User ${userId} cursor left board ${boardId}`);
    });

    socket.on("disconnect", () => {
      let disconnectedUserId = null;
      for (let [userId, id] of userSockets.entries()) {
        if (id === socket.id) {
          userSockets.delete(userId);
          disconnectedUserId = userId;
          logger.info(`User ${userId} disconnected and unregistered.`);
          break;
        }
      }
      for (const [boardId, sockets] of boardUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          logger.info(`Socket ${socket.id} left board ${boardId}`);

          if (disconnectedUserId && boardCursors.has(boardId)) {
            boardCursors.get(boardId).delete(disconnectedUserId);
            io.to(boardId).emit("cursor-remove", {
              userId: disconnectedUserId,
            });
          }

          if (sockets.size === 0) {
            boardUsers.delete(boardId);
            boardCursors.delete(boardId);
            logger.info(`Board ${boardId} is now empty, cleaned up.`);
          }
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

const getBoardCursors = (boardId) => {
  if (boardCursors.has(boardId)) {
    const cursors = {};
    for (const [userId, cursorData] of boardCursors.get(boardId).entries()) {
      cursors[userId] = cursorData;
    }
    return cursors;
  }
  return {};
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  broadcast,
  getBoardCursors,
};
