const express = require("express");
const auth = require("../middleware/auth");
const {
  getAllBoards,
  createBoard,
  getBoardById,
  deleteBoard,
  addCollaborator,
  saveBoard,
  removeCollaborator,
} = require("../controllers/mainController");

const router = express.Router();

router.use(auth); // protect all routes

router.get("/boards", getAllBoards);

router.post("/boards", createBoard);
router.get("/boards/:id", getBoardById);
router.delete("/boards/:id", deleteBoard);
router.post("/boards/collaborators", addCollaborator);
router.post("/boards/remove/collaborators", removeCollaborator);
router.post("/boards/save", saveBoard);

module.exports = router;
