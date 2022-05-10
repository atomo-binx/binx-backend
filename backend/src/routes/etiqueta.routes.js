const controller = require("../controllers/etiqueta.controller");

function load(routes) {
  routes.get("/expedicao/etiqueta/produto", controller.etiquetaProduto);
  routes.get("/expedicao/etiqueta/pedido", controller.etiquetaPedido);
}

module.exports = load;
