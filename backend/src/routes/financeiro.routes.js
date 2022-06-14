const controller = require("../controllers/caixa.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/financeiro/caixa", protectedRoute,  controller.listarCaixas);
  routes.get("/financeiro/caixa/:id", protectedRoute, controller.lerCaixa);
  routes.post("/financeiro/caixa", protectedRoute, controller.criarCaixa);
  routes.put("/financeiro/caixa", protectedRoute, controller.fecharCaixa);
}

module.exports = load;
