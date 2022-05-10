const business = require("../business/pedidocompra.business");

module.exports = {
  async sincroniza(req, res, next) {
    try {
      const resposta = await business.sincroniza(req);
      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async analisa(req, res, next) {
    try {
      const resposta = await business.analisa(req);
      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
