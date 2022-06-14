const controller = require("../controllers/pedidocompra.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/pedidocompra/sincroniza", controller.sincroniza);
  routes.get("/pedidocompra/analisa", controller.analisa);
}

module.exports = load;
