const controller = require("../controllers/precificacao.controller");

function load(routes) {
  routes.get("/precificacao", controller.itensParaPrecificar);
  routes.patch("/precificacao", controller.registrarPrecificacao);
}

module.exports = load;
