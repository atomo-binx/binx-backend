const controller = require("../controllers/fornecedor.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/fornecedor", protectedRoute, controller.listar);
}

module.exports = load;
