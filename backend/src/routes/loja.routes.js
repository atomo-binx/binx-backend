const controller = require("../controllers/loja.controller");

function load(routes) {
  routes.get("/loja", controller.index);
  routes.get("/loja/:idloja", controller.read);
}

module.exports = load;
