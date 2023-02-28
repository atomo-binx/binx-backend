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

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async escolherMelhorMetodo(req, res, next) {
    try {
      const { idPedidoVenda } = req.query;

      const resposta = await LogisticaBusiness.escolherMelhorMetodoAPI(idPedidoVenda);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async atualizarValorFreteTransportadora(req, res, next) {
    try {
      const { idPedidoVenda, valorFreteTransportadora } = req.body;

      const resposta = await LogisticaBusiness.atualizarValorFreteTransportadora(
        idPedidoVenda,
        valorFreteTransportadora
      );

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
