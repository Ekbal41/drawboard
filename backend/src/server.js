const server = require("./app");
const { prisma } = require("./config/prisma");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}.`);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("💥 Process terminated!");
  });
});
