const controller = require("../controllers/compras.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/compras/dashboard", controller.dashboard);
  routes.get("/compras/dashboard/salvar", protectedRoute, controller.salvarDashboardDiario);
  routes.get("/compras/disponibilidade", controller.disponibilidade);
}

module.exports = load;
