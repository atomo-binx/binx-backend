const controller = require("../controllers/precificacao.controller");

function load(routes) {
  routes.get("/precificacao", controller.itensParaPrecificar);
}

module.exports = load;
