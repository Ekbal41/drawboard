const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status =
    err.status || `${err.statusCode}`.startsWith("4") ? "fail" : "error";
  err.timestamp = err.timestamp || new Date().toISOString();
  err.details =
    err.details || (err.type === "entity.parse.failed" && "Invalid JSON");

  const { stackTrace, ...other } = err;
  const errorResponse = {
    ...other,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    message: err.message,
    stack:
      process.env.NODE_ENV === "development"
        ? formatStackTrace(err.stack)
        : "DISABLED_IN_PRODUCTION",
  };

  logger.error(
    `[${new Date().toISOString()}] ${req.method} ${err.statusCode} ${
      req.originalUrl
    } - ${err.message}`
  );
  res.status(err.statusCode).json({ ...errorResponse });
};

function formatStackTrace(stack) {
  if (!stack) return undefined;
  return stack.split("\n").map((line) => line.trim());
}
