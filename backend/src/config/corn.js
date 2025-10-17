const cron = require("node-cron");
const logger = require("../utils/logger");
const { clearAllCache } = require("./cache");
const prisma = require("./prisma");

cron.schedule(
  "0 3 * * *",
  async () => {
    try {
      await clearAllCache();
      logger.info(`Deleted all cached data.`);
    } catch (err) {
      logger.error("Error during cache invalidation:", err);
    }
  },
  { timezone: "Asia/Dhaka" }
);
