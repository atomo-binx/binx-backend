const controller = require("../controllers/analisecurva.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/analisecurva", protectedRoute, controller.analiseCurva);
  routes.get("/analisecurva/exportar", protectedRoute, controller.exportarAnalise);
}

module.exports = load;
