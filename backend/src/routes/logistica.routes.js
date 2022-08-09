const controller = require("../controllers/logistica.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/logistica/frete", protectedRoute, controller.calcularFrete); 
}

module.exports = load;
