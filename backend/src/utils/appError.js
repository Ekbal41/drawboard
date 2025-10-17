class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    { errorCode = null, metadata = null, isOperational = true } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.errorCode = errorCode || this.generateErrorCode();
    this.metadata = metadata;
    this.stackTrace = this.stack;
    Error.captureStackTrace(this, this.constructor);
  }

  generateErrorCode() {
    const prefix = this.status === "fail" ? "CLIENT_" : "SERVER_";
    const code = `${prefix}${this.statusCode}_${Math.floor(
      Math.random() * 1000
    )}`;
    return code;
  }

  static badRequest(message, details) {
    return new AppError(message, 400, { details, errorCode: "BAD_REQUEST" });
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, { errorCode: "UNAUTHORIZED" });
  }

  static userNotFound(message = "User not found") {
    return new AppError(message, 404, { errorCode: "USER_NOT_FOUND" });
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, { errorCode: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404, { errorCode: "NOT_FOUND" });
  }

  static conflict(message = "Conflict occurred") {
    return new AppError(message, 409, { errorCode: "CONFLICT" });
  }

  static internalError(message = "Internal server error") {
    return new AppError(message, 500, { errorCode: "INTERNAL_ERROR" });
  }
}

module.exports = AppError;
