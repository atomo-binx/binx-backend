const controller = require("../controllers/venda.controller");
const { protectedRoute } = require("../middleware/auth");

function load(routes) {
  routes.get("/sincroniza/pedidosvenda", protectedRoute, controller.iniciaSincronizacao);
  routes.get("/sincroniza/pedidosvendalista", controller.sincronizaPedidos);
  routes.post("/pedidovenda/callback", controller.callbackVendas);
}

module.exports = load;
