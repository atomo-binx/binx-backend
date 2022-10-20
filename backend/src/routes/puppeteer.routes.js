const controller = require("../controllers/puppeteer.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/puppeteer/alterartransportadora", controller.alterarTransportadora); 
}

module.exports = load;
