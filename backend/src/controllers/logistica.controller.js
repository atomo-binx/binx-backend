const LogisticaBusiness = require("../business/logistica.business.js");

module.exports = {
  async calcularFrete(req, res, next) {
    try {
      const { numero, tipo, venda } = req.query;

      const resposta = await LogisticaBusiness.calcularFrete(numero, tipo, venda);

      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
