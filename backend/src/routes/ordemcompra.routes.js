const controller = require("../controllers/ordemcompra.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/ordemcompra", protectedRoute, controller.incluir);
  routes.get("/ordemcompra", protectedRoute, controller.listar);
  routes.post("/ordemcompra/produto", protectedRoute, controller.incluirProduto);
}

module.exports = load;
