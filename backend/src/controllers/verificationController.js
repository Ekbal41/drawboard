const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { sendEmailVerificationLinkEmail } = require("../utils/verification");
const { redirectWithMsg } = require("../utils/redirect");
const { addNotification } = require("./notificationController");

exports.emailVerification = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Missing token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "emailVerification") {
      return res.status(400).json({ message: "Invalid token type!" });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { emailVerified: true },
    });

    // Send notification
    await addNotification({
      type: "user",
      targetId: decoded.userId,
      identifier: decoded.userId,
      event: "email_verified",
      message: "Your email has been successfully verified.",
    });

    return res.redirect(`${process.env.FRONTEND_URL}/?verified=true`);
  } catch (err) {
    return redirectWithMsg(
      res,
      "Invalid or expired token! Visit your account to resend the verification email."
    );
  }
};

exports.sendEmailVerificationLink = async (req, res) => {
  const done = await sendEmailVerificationLinkEmail({
    userEmail: req.user.email,
    userName: req.user.name,
    userId: req.user.id,
  });

  if (!done) {
    return res
      .status(500)
      .json({ message: "Failed to send verification email!" });
  }
  return res.status(200).json({
    message: `A verification email has been sent to your registered email address. 
      Please check your inbox (and spam folder) to complete the verification process.`,
  });
};
