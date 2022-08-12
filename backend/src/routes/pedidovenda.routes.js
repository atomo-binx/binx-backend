const controller = require("../controllers/venda.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/pedidovenda/sincroniza", protectedRoute, controller.sincronizaPedidosVenda);
  routes.post("/pedidovenda/callback", controller.callbackVendas);
}

module.exports = load;
