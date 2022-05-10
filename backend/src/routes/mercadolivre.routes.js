const controller = require("../controllers/mercadolivre.controller");

function load(routes) {
  routes.get("/mercadolivre/inserir", controller.inserir);
}

module.exports = load;
