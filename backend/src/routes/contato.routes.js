const controller = require("../controllers/contato.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/contato/sincroniza", protectedRoute, controller.sincronizarContatos);
}

module.exports = load;
