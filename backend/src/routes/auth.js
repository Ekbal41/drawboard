const express = require("express");
const authC = require("../controllers/authController");
const v = require("../middleware/validate");
const authVal = require("../validations/authValidation");
const protected = require("../middleware/auth");

const router = express.Router();

router.post("/register", v(authVal.register), authC.register);
router.post("/login", v(authVal.login), authC.login);
router.post("/logout", protected, authC.logout);
router.post("/refresh-token", protected, authC.refreshToken);
router.get("/me", protected, authC.getMe);
router.post("/change-password", protected, authC.changePassword);
router.post("/reset-password", authC.resetPassword);
router.post("/send-password-reset-link", authC.sendPassResetLinkEmail);

module.exports = router;
