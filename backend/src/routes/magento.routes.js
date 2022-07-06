const controller = require("../controllers/magento.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  // Pedido de Venda
  routes.get("/magento/pedidosvenda", protectedRoute, controller.pedidosVenda); 
  routes.get("/magento/pedidovenda", protectedRoute, controller.pedidoVenda); 

  // Produto
  routes.get("/magento/produto", protectedRoute, controller.produto); 
  routes.get("/magento/produtos", protectedRoute, controller.produtos); 
  routes.get("/magento/produto/imagens", protectedRoute, controller.imagensProduto); 
  routes.get("/magento/produto/atributos", protectedRoute, controller.conjuntoAtributos); 
}

module.exports = load;
