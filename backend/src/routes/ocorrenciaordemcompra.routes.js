const controller = require("../controllers/ocorrenciaordemcompra.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/ocorrenciaordemcompra", protectedRoute, controller.incluir);
  routes.get("/ocorrenciaordemcompra", protectedRoute, controller.listar);
}

module.exports = load;
