const controller = require("../controllers/puppeteer.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/puppeteer/manual", protectedRoute, controller.puppeteerManual); 
}

module.exports = load;
