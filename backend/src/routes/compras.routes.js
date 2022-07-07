const controller = require("../controllers/compras.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/compras/dashboard", controller.dashboard);
  routes.get("/compras/dashboard/salvar", protectedRoute, controller.salvarDashboardDiario);
  routes.get("/compras/disponibilidade", controller.disponibilidade);

  routes.get("/compras/relatorio/precificacao", protectedRoute, controller.relatorioPrecificacao);
  routes.get("/compras/relatorio/ultimocusto", protectedRoute, controller.relatorioUltimoCusto);
  routes.get("/compras/relatorio/situacaoestoque", protectedRoute, controller.relatorioSituacaoEstoque);
  routes.get("/compras/relatorio/compraproduto", protectedRoute, controller.relatorioCompraProduto);
}

module.exports = load;
