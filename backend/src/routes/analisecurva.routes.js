const controller = require("../controllers/analisecurva.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/analisecurva", protectedRoute, controller.analiseCurva);
}

module.exports = load;
