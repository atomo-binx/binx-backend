const ControllerCompras = require("../controllers/compras.controller");
const ControllerRelatorios = require("../controllers/relatoriocompras.controller");

const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.get("/compras/dashboard", ControllerCompras.dashboard);
  routes.get("/compras/dashboard/salvar", protectedRoute, ControllerCompras.salvarDashboard);
  routes.get("/compras/disponibilidade", protectedRoute, ControllerCompras.dashboardDisponibilidade);
  routes.get("/compras/montantes", protectedRoute, ControllerCompras.dashboardMontantes);

  routes.get("/compras/relatorio/precificacao", protectedRoute, ControllerCompras.relatorioPrecificacao);
  routes.get("/compras/relatorio/ultimocusto", protectedRoute, ControllerCompras.relatorioUltimoCusto);
  routes.get("/compras/relatorio/situacaoestoque", protectedRoute, ControllerCompras.relatorioSituacaoEstoque);
  routes.get("/compras/relatorio/compraproduto", protectedRoute, ControllerCompras.relatorioCompraProduto);
  routes.get("/compras/relatorio/analiseestoque", protectedRoute, ControllerCompras.relatorioTransferencia);
  routes.get("/compras/relatorio/montagemkits", protectedRoute, ControllerCompras.relatorioMontagemKits);

  routes.get("/compras/relatorio/geral", protectedRoute, ControllerRelatorios.relatorioGeral);
}

module.exports = load;
