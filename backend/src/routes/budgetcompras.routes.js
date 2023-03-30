const controller = require("../controllers/budgetcompras.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/budgetcompras/dashboard", protectedRoute, controller.dashboard);
}

module.exports = load;
