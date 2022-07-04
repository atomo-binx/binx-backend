const controller = require("../controllers/magento.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/magento/pedidosvenda", protectedRoute, controller.listaPedidosVenda); 
  routes.get("/magento/produto", protectedRoute, controller.produto); 
}

module.exports = load;
