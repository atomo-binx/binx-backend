const controller = require("../controllers/orcamento.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/orcamento", protectedRoute, controller.incluir);
}

module.exports = load;
