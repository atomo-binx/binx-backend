const controller = require("../controllers/logistica.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/logistica/frete", protectedRoute, controller.calcularFrete); 
  
  // Funções novas para a extração da lógica do puppeteer
  routes.get("/logistica/pedidos/transportadorabinx", protectedRoute, controller.pedidosComTransportadoraBinx); 
  routes.get("/logistica/pedidos/escolhermetodo", protectedRoute, controller.escolherMelhorMetodo); 
  routes.patch("/logistica/pedidos/atualizarvalorfrete", protectedRoute, controller.atualizarValorFreteTransportadora); 
}

module.exports = load;
