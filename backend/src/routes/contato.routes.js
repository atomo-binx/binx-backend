const controller = require("../controllers/contato.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/contato/teste", protectedRoute,  controller.sincronizaContatos);
}

module.exports = load;
