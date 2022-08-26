const RelatorioComprasBusiness = require("../business/relatorioscompras.business");

module.exports = {
  async relatorioGeral(req, res, next) {
    try {
      const resposta = await RelatorioComprasBusiness.relatorioGeral();

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
