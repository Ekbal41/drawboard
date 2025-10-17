const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const prisma = require("../config/prisma");

module.exports = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(AppError.unauthorized("AccessToken not found!"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (err) {
      return next(AppError.unauthorized("Invalid or expired token!"));
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(AppError.unauthorized("User not found!"));
    }
    const { password, refreshToken, ...safeUserData } = currentUser;
    req.user = safeUserData;
    next();
  } catch (err) {
    next(err);
  }
};
