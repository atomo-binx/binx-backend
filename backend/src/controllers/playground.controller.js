const PlaygroundBusiness = require("../business/playground.business");

module.exports = {
  async ultimocusto(req, res) {
    const resposta = await PlaygroundBusiness.ultimocusto(req);
    res.status(resposta.statusCode).json(resposta.body);
  },

  async listarDashboards(req, res) {
    const resposta = await PlaygroundBusiness.listarDashboards(req);
    res.status(resposta.statusCode).json(resposta.body);
  },

  async adquirirDashboardUrl(req, res) {
    const { dashboardId } = req.query;

    const resposta = await PlaygroundBusiness.adquirirDashboardUrl(dashboardId);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
