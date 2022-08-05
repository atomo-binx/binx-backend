const VendaBusiness = require("../business/venda.business");

module.exports = {
  // Inicia procedimento de sincronização
  async iniciaSincronizacao(req, res) {
    const status = await VendaBusiness.iniciaSincronizacao(req);

    if (status) {
      res.status(200).send({
        message: "A sincronização de pedidos de venda foi iniciada e está em andamento.",
      });
    } else {
      res.status(500).send({
        message:
          "A sincronização de pedidos de venda não foi iniciada, verifique os logs para mais detalhes.",
      });
    }
  },

  // Lista pedidos de venda do banco de dados
  async listaPedidosVenda(req, res) {
    const { status, vendas } = await VendaBusiness.listaPedidosVenda(req);

    if (status) {
      res.status(200).send(JSON.stringify(vendas));
    } else {
      res.status(500).send({
        message: "Falha na aquisição de pedidos de vendas.",
      });
    }
  },

  // Sincroniza um pedido de venda específico (ou uma lista de pedidos de venda)
  async sincronizaPedidos(req, res) {
    const status = await VendaBusiness.sincronizaPedidos(req);

    if (status) {
      res.status(200).send({
        message: "Procedimento de sincronização de pedido(s) de venda finalizado",
      });
    } else {
      res.status(500).send({
        message: "Falha na sincronização do(s) pedido()s de venda",
      });
    }
  },

  // Rota para recebe ro Callback de alteração de pedido de venda do Bling
  async callbackVendas(req, res) {
    const resposta = await VendaBusiness.callbackVendas(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

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
};
