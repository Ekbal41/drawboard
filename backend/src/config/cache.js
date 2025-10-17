const NodeCache = require("node-cache");
const logger = require("../utils/logger");

// Configuration
const cacheConfig = {
  stdTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600,
  maxKeys: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
};

const nodeCache = new NodeCache({
  stdTTL: cacheConfig.stdTTL,
  checkperiod: cacheConfig.checkperiod,
  useClones: false,
  maxKeys: cacheConfig.maxKeys,
});

logger.info("NodeCache cache initialized successfully");

const key = (req) => {
  return `cache:${req.method}:${req.originalUrl}`;
};

const cache = (duration) => {
  return (req, res, next) => {
    const cacheKey = key(req);
    try {
      const cachedData = nodeCache.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json({
          ...cachedData,
          cached: true,
        });
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const responseBody = { ...body, cached: false };
        try {
          originalJson(responseBody);
          nodeCache.set(cacheKey, body, duration);
          logger.debug(`Cache set for key: ${cacheKey}`);
        } catch (err) {
          logger.error(`Cache set failed for key: ${cacheKey}`, err);
          originalJson(responseBody);
        }
      };
      next();
    } catch (err) {
      logger.error(`Cache middleware error for key: ${cacheKey}`, err);
      next();
    }
  };
};

const invalidateCache = (key) => {
  try {
    const success = nodeCache.del(key);
    if (success) logger.info(`Cache invalidated for key: ${key}`);
    return success;
  } catch (err) {
    logger.error(`Cache invalidation failed for key: ${key}`, err);
    throw err;
  }
};

const clearAllCache = () => {
  try {
    nodeCache.flushAll();
    logger.info("All cache entries cleared successfully.");
  } catch (err) {
    logger.error("Failed to clear all cache entries.", err);
    throw err;
  }
};

module.exports = {
  nodeCache,
  invalidateCache,
  clearAllCache,
  key,
  cache,
  cached: cache(),
};
