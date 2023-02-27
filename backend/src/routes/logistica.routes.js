const controller = require("../controllers/logistica.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/logistica/frete", protectedRoute, controller.calcularFrete); 
  
  // Funções novas para a extração da lógica do puppeteer
  routes.get("/logistica/pedidos/transportadora/binx", protectedRoute, controller.pedidosComTransportadoraBinx); 
  routes.get("/logistica/pedidos/dados", protectedRoute, controller.adquirirDadosPedido); 
}

module.exports = load;
