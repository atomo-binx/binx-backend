const controller = require("../controllers/produto.controller");

function load(routes) {
  routes.get("/sincroniza/produtos", controller.startSync);
  routes.post("/produto/callback", controller.callbackProdutos);
  routes.get("/produto/buscar", controller.buscarProdutos);
}

module.exports = load;
