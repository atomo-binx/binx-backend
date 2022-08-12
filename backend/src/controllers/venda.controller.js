const VendaBusiness = require("../business/venda.business");

module.exports = {
  async sincronizaPedidosVenda(req, res, next) {
    try {
      const { all, periodo, situacao, unidade, tempo, pedidos } = req.query;

      // const rules = [[userId, UserIdValidator]];

      // const validationResult = validation.run(rules);

      // if (validationResult["status"] === "error") {
      //   return res.status(400).json(validationResult);
      // }

      const arrayPedidos = pedidos ? pedidos.split(",").map((element) => element.trim()) : null;

      VendaBusiness.sincronizaPedidosVenda(all, periodo, situacao, unidade, tempo, arrayPedidos);

      return res.status(200).json({
        message: "A sincronização de pedidos de venda foi iniciada em segundo plano.",
      });
    } catch (error) {
      next(error);
    }
  },

  async callbackVendas(req, res, next) {
    try {
      const pedido = JSON.parse(req.body.data).retorno.pedidos[0].pedido;

      const resposta = await VendaBusiness.novaCallbackVendas(pedido);

      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
