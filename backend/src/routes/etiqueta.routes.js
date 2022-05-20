const controller = require("../controllers/etiqueta.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/expedicao/etiqueta/produto", protectedRoute, controller.etiquetaProduto);
  routes.post("/expedicao/etiqueta/pedido", protectedRoute, controller.etiquetaPedido);
  routes.delete("/expedicao/etiqueta", protectedRoute, controller.removerEtiquetas);
}

module.exports = load;
