const ComprasBusiness = require("../business/compras.business");
const { OkStatus } = require("../modules/codes");

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

  async relatorioPrecificacao(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioPrecificacao();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async ultimoCusto(req, res, next) {
    try {
      const resposta = await ComprasBusiness.ultimoCusto();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },
};
