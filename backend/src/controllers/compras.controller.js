const ComprasBusiness = require("../business/compras.business");
const Disponibilidade = require("../models/disponibilidade.model");

module.exports = {
  async dashboard(req, res) {
    const resposta = await ComprasBusiness.dashboard();
    res.status(resposta.statusCode).json(resposta.body);
  },

  async salvarDashboardDiario(req, res) {
    const resposta = await ComprasBusiness.salvarDashboardDiario(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  async disponibilidade(req, res) {
    const resposta = await ComprasBusiness.disponibilidade(req);
    res.status(resposta.statusCode).json(resposta.body);
  },

  async analiseCompras(req, res, next) {
    try {
      const resposta = await ComprasBusiness.analiseCompras();
      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
