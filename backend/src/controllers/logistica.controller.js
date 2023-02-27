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

  // Funções novas para a extração da lógica do puppeteer
  async pedidosComTransportadoraBinx(req, res, next) {
    try {
      const resposta = await LogisticaBusiness.pedidosComTransportadoraBinx();

      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async adquirirDadosPedido(req, res, next) {
    try {
      const { venda } = req.query;

      const resposta = await LogisticaBusiness.adquirirDadosPedido(venda);

      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async adquirirMetodosFrete(req, res, next) {},

  async escolherMelhorMetodo(req, res, next) {},

  async atualizarValorFreteTransportadora(req, rex, next) {},
};
