const controller = require("../controllers/etiqueta.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/expedicao/etiqueta/produto", protectedRoute, controller.etiquetaProduto);
  routes.get("/expedicao/etiqueta/pedido", protectedRoute, controller.etiquetaPedido);
  routes.get("/expedicao/etiqueta/personalizada", protectedRoute, controller.etiquetaPersonalizada);
  routes.get("/expedicao/etiqueta/estrutura", protectedRoute, controller.etiquetaEstrutura);
  routes.delete("/expedicao/etiqueta", protectedRoute, controller.removerEtiquetas);
}

module.exports = load;
