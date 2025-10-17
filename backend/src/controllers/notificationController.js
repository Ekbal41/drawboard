const prisma = require("../config/prisma");
const { emitToUser, broadcast } = require("../config/socket");

exports.addNotification = async ({
  type,
  targetId,
  identifier,
  message,
  payload,
  event,
  emit = true,
}) => {
  const notification = await prisma.notification.create({
    data: { type, targetId, identifier, event, message, payload },
  });
  if (emit) {
    switch (type) {
      case "shop":
      case "user":
        if (targetId) emitToUser(targetId, `notification`, notification);
        break;
      case "system":
        broadcast("notification", notification);
        break;
    }
  }
  return notification;
};

exports.getNotifications = async (req, res) => {
  try {
    const { shopId, types, page = 1, limit = 4 } = req.query;
    const userId = req.user?.id;
    const skip = (Number(page) - 1) * Number(limit);

    if (!types) {
      return res
        .status(400)
        .json({ error: "At least one type is required (user, shop, system)" });
    }

    const typeArray = types.split(",").map((t) => t.trim().toLowerCase());
    if (!typeArray.length) {
      return res
        .status(400)
        .json({ error: "At least one type is required (user, shop, system)" });
    }

    const conditions = [];
    if (typeArray.includes("user")) {
      conditions.push({ type: "user", identifier: userId });
    }

    if (typeArray.includes("shop")) {
      if (!shopId) {
        return res
          .status(400)
          .json({ error: "shopId is required for shop notifications." });
      }
      conditions.push({ type: "shop", identifier: shopId });
    }

    if (typeArray.includes("system")) {
      conditions.push({ type: "system" });
    }

    const where = { OR: conditions };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, read: false } }),
    ]);

    const unreadBreakdown = {};
    for (const type of typeArray) {
      let condition;
      if (type === "user") condition = { type: "user", identifier: userId };
      if (type === "shop") condition = { type: "shop", identifier: shopId };
      if (type === "system") condition = { type: "system" };

      unreadBreakdown[type] = await prisma.notification.count({
        where: { ...condition, read: false },
      });
    }

    res.json({
      notifications,
      unreadCount,
      unreadBreakdown,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { shopId, types } = req.body;
    const userId = req.user?.id;

    const typeArray = types ? types.split(",").map((t) => t.trim()) : [];
    if (!typeArray.length) {
      return res
        .status(400)
        .json({ error: "At least one type is required (user, shop, system)" });
    }

    const conditions = [];
    if (typeArray.includes("user"))
      conditions.push({ type: "user", identifier: userId });

    if (typeArray.includes("shop")) {
      if (!shopId)
        return res
          .status(400)
          .json({ error: "shopId is required for shop notifications" });
      conditions.push({ type: "shop", identifier: shopId });
    }

    if (typeArray.includes("system")) conditions.push({ type: "system" });
    const where = { OR: conditions, read: false };
    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    });

    const unreadBreakdown = {};
    for (const type of typeArray) {
      let condition;
      if (type === "user") condition = { type: "user", identifier: userId };
      if (type === "shop") condition = { type: "shop", identifier: shopId };
      if (type === "system") condition = { type: "system" };

      unreadBreakdown[type] = await prisma.notification.count({
        where: { ...condition, read: false },
      });
    }
    res.json({
      message: "Selected notifications marked as read.",
      updatedCount: result.count,
      unreadBreakdown,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUnreadNotificationsByShopIds = async (req, res) => {
  try {
    const { shopIds } = req.query;
    if (!shopIds) {
      return res.status(400).json({ message: "shopIds is required" });
    }

    const shopIdArray = shopIds.split(",").map((id) => id.trim());

    const notifications = await prisma.notification.findMany({
      where: {
        type: "shop",
        identifier: { in: shopIdArray },
        read: false,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong." });
  }
};
