const controller = require("../controllers/caixa.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/controlecaixa", protectedRoute,  controller.listarCaixas);
  routes.get("/controlecaixa/:id", protectedRoute, controller.lerCaixa);
  routes.post("/controlecaixa", protectedRoute, controller.criarCaixa);
}

module.exports = load;
