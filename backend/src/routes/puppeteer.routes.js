const controller = require("../controllers/puppeteer.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/puppeteer/alterartransportadora", protectedRoute, controller.alterarTransportadora); 
}

module.exports = load;
