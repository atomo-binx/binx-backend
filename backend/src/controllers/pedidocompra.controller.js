const business = require("../business/pedidocompra.business");

module.exports = {
  async sincroniza(req, res, next) {
    try {
      const { tudo, inicio, fim, periodo, valor, situacao, pedidos, sincrono = false } = req.query;

      const arrayPedidos = pedidos ? pedidos.split(",").map((element) => element.trim()) : null;

      if (sincrono === "true" || sincrono === true) {
        const resposta = await business.sincronizaPedidosCompra(
          tudo,
          inicio,
          fim,
          periodo,
          valor,
          situacao,
          arrayPedidos
        );

        return res.status(resposta.statusCode).json(resposta.body);
      } else {
        business.sincronizaPedidosCompra(tudo, inicio, fim, periodo, valor, situacao, arrayPedidos);

        return res.status(200).json({
          message: "A sincronização de pedidos de compra foi iniciada em segundo plano.",
        });
      }
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
