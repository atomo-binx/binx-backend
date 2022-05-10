const controller = require("../controllers/prospeccao.controller");

function load(routes) {
  routes.post("/vendas/prospeccao", controller.criarProspeccao);
  routes.put("/vendas/prospeccao", controller.atualizarProspeccao);
  routes.get("/vendas/prospeccao", controller.listarProspeccoes);
  routes.post("/vendas/prospeccao/validar", controller.validarProspeccao);
}

module.exports = load;
