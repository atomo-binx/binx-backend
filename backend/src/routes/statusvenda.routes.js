const controller = require("../controllers/status.controller");

function load(routes) {
  routes.get("/status", controller.index); // Lista todos os status de venda
  routes.get("/status/:idstatus", controller.read); // Lista um status de venda específico
}

module.exports = load;
