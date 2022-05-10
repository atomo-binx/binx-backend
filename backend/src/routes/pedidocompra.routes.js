const controller = require("../controllers/pedidocompra.controller");
const { protectedRoute } = require("../middleware/auth");

function load(routes) {
  routes.get("/pedidocompra/sincroniza", controller.sincroniza);
  routes.get("/pedidocompra/analisa", controller.analisa);
}

module.exports = load;
