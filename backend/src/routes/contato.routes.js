const controller = require("../controllers/contato.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/contato/sincroniza", protectedRoute, controller.sincronizarContatos);
  routes.post("/contato", protectedRoute, controller.incluir);

}

module.exports = load;
