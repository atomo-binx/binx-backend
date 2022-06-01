const controller = require("../controllers/caixa.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/financeiro/controlecaixa", protectedRoute,  controller.listarCaixas);
  routes.get("/financeiro/controlecaixa/:id", protectedRoute, controller.lerCaixa);
  routes.post("/financeiro/controlecaixa", protectedRoute, controller.criarCaixa);
}

module.exports = load;
