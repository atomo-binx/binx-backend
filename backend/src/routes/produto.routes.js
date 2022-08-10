const controller = require("../controllers/produto.controller");

function load(routes) {
  // Retro Compatibilidade
  routes.get("/sincroniza/produtos", controller.sincronizaProdutos);
  routes.get("/produto/buscar", controller.buscarProdutos);

  routes.get("/produto/sincroniza", controller.sincronizaProdutos);
  routes.post("/produto/callback", controller.callbackProdutos);
  routes.get("/produto", controller.buscarProdutos);
}

module.exports = load;
