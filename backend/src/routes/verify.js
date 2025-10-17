const express = require("express");
const verifyC = require("../controllers/verificationController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/email-verification", verifyC.emailVerification);
router.get(
  "/send-email-verification-link",
  auth,
  verifyC.sendEmailVerificationLink
);

module.exports = router;
