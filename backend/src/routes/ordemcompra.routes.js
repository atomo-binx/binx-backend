const controller = require("../controllers/ordemcompra.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/ordemcompra", protectedRoute, controller.incluirOrdemCompra);
  routes.get("/ordemcompra", protectedRoute, controller.listarOrdensCompra);
  routes.put("/ordemcompra/:id", protectedRoute, controller.atualizarOrdemCompra);

  routes.get("/ordemcompra/:id", protectedRoute, controller.lerOrdemCompra);
  routes.post("/ordemcompra/produto", protectedRoute, controller.incluirProduto);
  
}

module.exports = load;
