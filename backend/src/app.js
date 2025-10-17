require("./config/corn");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const logger = require("./utils/logger");
const sUI = require("swagger-ui-express");
const { PrismaClient } = require("@prisma/client");
const errorHandler = require("./middleware/errorHandler");
const sFile = require("./swagger.json");
const http = require("http");
const { initSocket } = require("./config/socket");

const allRouter = require("./routers");
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
initSocket(server);

require("dotenv").config();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.set("cross-origin-resource-policy", "cross-origin");
    },
  })
);

app.use(
  cors({
    credentials: false,
    optionSuccessStatus: 200,
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", allRouter);
app.use("/", sUI.serve, sUI.setup(sFile));
app.use(errorHandler);

prisma
  .$connect()
  .then(() => logger.info("Connected to SQLite database!"))
  .catch((err) => logger.error("Database connection error", err));

module.exports = server;
