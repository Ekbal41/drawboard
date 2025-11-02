const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { addNotification } = require("./notificationController");

exports.saveBoard = async (req, res) => {
  try {
    const { boardId, drawing } = req.body;
    const userId = req.user.id;

    if (!boardId)
      return res.status(400).json({ error: "Board ID is required" });
    if (drawing === undefined)
      return res.status(400).json({ error: "Board data is required" });

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { collaborators: true },
    });

    if (!board) return res.status(404).json({ error: "Board not found" });

    // Check access (owner or collaborator)
    const isOwner = board.ownerId === userId;
    const isCollaborator = board.collaborators.some((c) => c.userId === userId);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: { drawingData: drawing },
    });

    res.json({ message: "Board saved successfully", board: updatedBoard });
  } catch (error) {
    console.error("Error saving board:", error);
    res.status(500).json({ error: "Failed to save board" });
  }
};

exports.getAllBoards = async (req, res) => {
  try {
    const userId = req.user.id;

    const boards = await prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        collaborators: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
};

exports.createBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const newBoard = await prisma.board.create({
      data: {
        title: title.trim(),
        ownerId: userId,
      },
    });

    res.status(201).json(newBoard);
    await addNotification({
      type: "user",
      targetId: userId,
      identifier: userId,
      message: `New board "${newBoard.title}" created.`,
    });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
};

exports.getBoardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        owner: true,
        collaborators: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!board) return res.status(404).json({ error: "Board not found" });

    // Check access (owner or collaborator)
    const isOwner = board.ownerId === userId;
    const isCollaborator = board.collaborators.some((c) => c.userId === userId);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(board);
  } catch (error) {
    console.error("Error getting board:", error);
    res.status(500).json({ error: "Failed to get board" });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return res.status(404).json({ error: "Board not found" });
    if (board.ownerId !== userId)
      return res
        .status(403)
        .json({ error: "Only owner can delete this board" });

    await prisma.board.delete({ where: { id } });
    res.json({ message: "Board deleted successfully" });
    await addNotification({
      type: "user",
      targetId: userId,
      identifier: userId,
      message: `Board "${board.title}" deleted.`,
    });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { boardId, userEmail } = req.body;
    const ownerId = req.user.id;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    if (board.ownerId !== ownerId) {
      return res
        .status(403)
        .json({ error: "Only the board owner can invite collaborators" });
    }
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!userToAdd) {
      return res.status(404).json({ error: "User not found" });
    }
    if (userToAdd.id === ownerId) {
      return res
        .status(400)
        .json({ error: "You cannot add yourself as a collaborator" });
    }
    await prisma.collaboration.upsert({
      where: { userId_boardId: { userId: userToAdd.id, boardId } },
      update: {},
      create: { userId: userToAdd.id, boardId },
    });

    return res.json({ message: "Collaborator added successfully" });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return res.status(500).json({ error: "Failed to add collaborator" });
  }
};

exports.removeCollaborator = async (req, res) => {
  try {
    const { boardId, userId: collaboratorId } = req.body;
    const ownerId = req.user.id;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return res.status(404).json({ error: "Board not found" });
    if (board.ownerId !== ownerId)
      return res
        .status(403)
        .json({ error: "Only owner can remove collaborators" });

    await prisma.collaboration.delete({
      where: { userId_boardId: { userId: collaboratorId, boardId } },
    });

    res.json({ message: "Collaborator removed successfully" });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    res.status(500).json({ error: "Failed to remove collaborator" });
  }
};
