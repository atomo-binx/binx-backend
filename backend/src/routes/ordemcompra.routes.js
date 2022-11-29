const controller = require("../controllers/ordemcompra.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/ordemcompra", protectedRoute, controller.incluir);
  routes.post("/ordemcompra/ocorrencia", protectedRoute, controller.incluirOcorrencia);
  
}

module.exports = load;
