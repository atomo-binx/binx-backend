const controller = require("../controllers/etiqueta.controller");
const { protectedRoute } = require("../middleware/auth");

function load(routes) {
  routes.post("/expedicao/etiqueta/produto", protectedRoute, controller.etiquetaProduto);
  routes.post("/expedicao/etiqueta/pedido", protectedRoute, controller.etiquetaPedido);
}

module.exports = load;
