const controller = require("../controllers/frete.controller");

function load(routes) {
  routes.get("/frete/:proposta", controller.calcularFrete);
}

module.exports = load;
