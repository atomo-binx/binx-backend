const controller = require("../controllers/playground.controller");

function load(routes) {
  routes.get("/playground/ultimocusto", controller.ultimocusto);

  routes.get("/playground/quicksight/listar", controller.listarDashboards);
  routes.get("/playground/quicksight/adquirir", controller.adquirirDashboardUrl);
}

module.exports = load;
