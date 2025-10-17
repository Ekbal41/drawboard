const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/email");

function generateEmailVerificationToken(userId) {
  return jwt.sign(
    { userId, type: "emailVerification" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

async function sendEmailVerificationLinkEmail({ userEmail, userName, userId }) {
  const token = generateEmailVerificationToken(userId);
  const verificationLink = `${process.env.APP_URL}/verify/email-verification?token=${token}`;
  const done = await sendEmail({
    sendTo: userEmail,
    senderName: "Dokanify",
    emailSubject: "Verify Your Email Address",
    htmlTemplate: "verify-email.html",
    templateData: {
      name: userName,
      verificationLink,
      year: new Date().getFullYear(),
    },
  });
  return done;
}
module.exports = {
  generateEmailVerificationToken,
  sendEmailVerificationLinkEmail,
};
