const logger = require("../utils/logger");
const swaggerAutogen = require("swagger-autogen")({
  disableLogs: true,
});
const outputFile = "../swagger.json";
const endpointsFiles = ["../routers.js"];

const swaggerOptions = {
  swagger: "2.0",
  info: {
    title: "1M Blog API",
    version: "1.0.0",
    description: "API Documentation",
  },
  host: "localhost:3000",
  schemes: ["http", "https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT Authorization. Example: 'Bearer {token}'",
    },
  },
  security: [{ bearerAuth: [] }],
};

swaggerAutogen(outputFile, endpointsFiles, swaggerOptions).then(() => {
  logger.info("Swagger documentation generated successfully.");
});
