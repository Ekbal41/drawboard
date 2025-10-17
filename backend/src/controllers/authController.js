const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");
const prisma = require("../config/prisma");
const { sendEmail } = require("../services/email");
const { addNotification } = require("./notificationController");

const generateAccessToken = (minUserData) => {
  return jwt.sign(minUserData, process.env.JWT_SECRET || "secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "refresh", {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const saveRefreshToken = async (userId, token) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token },
  });
};

exports.facebook = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { accessToken } = req.body;
    if (!accessToken)
      return next(AppError.badRequest("Facebook access token required!"));
    const fbRes = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        access_token: accessToken,
        fields: "id,name,email",
      },
    });

    const { id: facebookId, name, email } = fbRes.data;
    let user = await prisma.user.findUnique({
      where: { facebookId },
    });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { email },
          data: { facebookId },
        });
      } else {
        user = await prisma.user.create({
          data: { name, email, role: "user", facebookId },
          select: { id: true, email: true, name: true, role: true },
        });
      }
    }

    const minUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const [accessJWT, refreshJWT] = await Promise.all([
      generateAccessToken(minUserData),
      generateRefreshToken(user.id),
    ]);

    await saveRefreshToken(user.id, refreshJWT);
    res.status(200).json({
      status: "success",
      tokens: { accessToken: accessJWT, refreshToken: refreshJWT },
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(AppError.conflict("Email already in use!"));
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    const minUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(minUserData),
      generateRefreshToken(user.id),
    ]);

    await saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      status: "success",
      tokens: {
        accessToken,
        refreshToken,
      },
    });
    await addNotification({
      type: "user",
      targetId: user.id,
      identifier: user.id,
      message: `Welcome, ${user.name}! Your account has been successfully created.`,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(AppError.userNotFound("Invalid credentials!"));
    }
    const minUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(minUserData),
      generateRefreshToken(user.id),
    ]);

    await saveRefreshToken(user.id, refreshToken);
    res.status(200).json({
      status: "success",
      tokens: {
        accessToken,
        refreshToken,
      },
    });
    await addNotification({
      type: "user",
      targetId: user.id,
      identifier: user.id,
      message: `Hello ${user.name}, welcome back!`,
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return next(AppError.badRequest("Refresh token required"));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user || user.refreshToken !== refreshToken) {
      return next(AppError.unauthorized("Invalid refresh token"));
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await saveRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      status: "success",
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
    await addNotification({
      type: "user",
      targetId: req.user.id,
      identifier: req.user.id,
      message: `You have successfully logged out, ${req.user.name}.`,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res) => {
  /* #swagger.tags = ['User']*/
  res.status(200).json({
    status: "success",
    user: req.user,
  });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(AppError.userNotFound("User not found!"));

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "fail",
        message: "Old password is incorrect!",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 8);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword, refreshToken: null },
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
    await addNotification({
      type: "user",
      targetId: req.user.id,
      identifier: req.user.id,
      message: `User changed password on ${new Date().toISOString()}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      if (decoded.type !== "passwordReset") {
        return res.status(400).json({ message: "Invalid token type!" });
      }
    } catch (err) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired reset token! Request a new link.",
      });
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return next(AppError.userNotFound("User not found!"));

    const hashedNewPassword = await bcrypt.hash(newPassword, 8);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedNewPassword, refreshToken: null },
    });

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
    await addNotification({
      type: "user",
      targetId: decoded.id,
      identifier: decoded.id,
      message: `User reset password on ${new Date().toISOString()}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.sendPassResetLinkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(AppError.badRequest("Email is required!"));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(AppError.userNotFound("User not found!"));

    const token = jwt.sign(
      { id: user.id, type: "passwordReset" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );
    const resetLink = `${process.env.FRONTEND_URL}/auth/change-password?token=${token}`;

    // Send email
    await sendEmail({
      sendTo: email,
      senderName: "Dokanify",
      emailSubject: "Reset Password Instructions",
      htmlTemplate: "reset-password.html",
      templateData: {
        name: user.name,
        resetLink,
        year: new Date().getFullYear(),
      },
    });

    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email!",
    });
  } catch (err) {
    next(err);
  }
};
