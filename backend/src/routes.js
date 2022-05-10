const express = require("express");
const routes = express.Router();
const requireDir = require("require-dir");

const routesDefinition = requireDir("./routes", {
  filter: (fullPath) => {
    return !fullPath.includes("index")
  },
});

for (const definition in routesDefinition) {
  routesDefinition[definition](routes);
}

module.exports = routes;
