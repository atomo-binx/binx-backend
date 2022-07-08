const controller = require("../controllers/componex.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/componex/sincronizacadastro", protectedRoute, controller.sincronizaCadastro); 
}

module.exports = load;
