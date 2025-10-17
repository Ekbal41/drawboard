const express = require("express");
const systemController = require("../controllers/systemController");
const notiController = require("../controllers/notificationController");
const protected = require("../middleware/auth");

const router = express.Router();

router.get("/health", systemController.getHealth);
router.get("/info", systemController.getSystemInfo);
router.get("/version", systemController.getApiVersion);
router.get("/notifications", protected, notiController.getNotifications);
router.patch("/:notificationId/read", protected, notiController.markAsRead);
router.post("/notifications/read-all", protected, notiController.markAllAsRead);
router.get(
  "/notifications/shops",
  protected,
  notiController.getUnreadNotificationsByShopIds
);

module.exports = router;
