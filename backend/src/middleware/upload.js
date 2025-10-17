const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype))
      return cb(new Error("Only .jpg, .png, or .webp files are allowed!"));
    cb(null, true);
  },
});

const saveFile = (file, customName) => {
  if (!file || !file.buffer) return null;
  const ext = path.extname(file.originalname);
  const filename =
    customName || `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${filename}`;
};

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ""));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};
module.exports = { upload, saveFile, deleteFile };
