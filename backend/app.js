const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config({ path: ".env" });
const errorHandlerAsync = require("express-async-errors");
const customErrorHandler = require("./src/modules/error");

const app = express();

app.use(
  cors({
    exposedHeaders: "filename",
  })
);
app.use(express.json({ limit: "1gb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "1gb",
  })
);

app.use("/api", require("./src/routes"));

app.get(["/", "/api"], (req, res) => {
  return res.status(200).send({
    message: "Binx API",
  });
});

app.all("/*", async (req, res) => {
  return res.status(404).json({
    status: "error",
    code: "NotFound",
    message:
      "A rota solicitada não foi encontrada ou implementada. Verifique a documentação: ...",
  });
});

app.use(customErrorHandler);

module.exports = app;
