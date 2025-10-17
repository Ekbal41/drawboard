const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../../utils/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) logger.error("Email server is not ready: ", error);
  else logger.info("Email server is ready to take messages");
});

const loadTemplate = async (templateName, replacements = {}) => {
  const filePath = path.resolve(
    __dirname,
    "../../services/email/templates",
    templateName
  );
  let html = await fs.readFile(filePath, "utf-8");

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    html = html.replace(regex, value);
  }

  return html;
};

const sendEmail = async ({
  sendTo,
  emailSubject,
  emailText,
  senderName,
  htmlTemplate,
  templateData,
}) => {
  if (!sendTo) throw new Error("Recipient email (sendTo) is required.");
  if (!emailSubject) throw new Error("Email subject is required.");
  if (!emailText && !htmlTemplate)
    throw new Error("Either emailText or htmlTemplate must be provided.");

  let emailHtml;
  if (htmlTemplate) {
    emailHtml = await loadTemplate(htmlTemplate, templateData);
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName || "Dokanify"}" <${process.env.GMAIL_USER}>`,
      to: sendTo,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    logger.info(`Email sent successfully to ${sendTo}.`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${sendTo}. Error: ${error.message}`);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = { sendEmail };
