const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const LogisticaBusiness = require("../business/logistica.business");
const Bling = require("../bling/bling");
const { ok } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { dictionary } = require("../utils/dict");

module.exports = {
  async puppeteerManual() {
    console.log(filename, "Iniciando procedimento de alteração de transportadora.");

    const pedidos = await models.tbpedidovenda.findAll({
      where: {
        transportadora: "Binx",
        idstatusvenda: {
          [Op.notIn]: [9, 12],
        },
      },
      raw: true,
    });

    console.log(filename, "Quantidade de pedidos para alteração:", pedidos.length);

    const pedidoComMetodosEscolhidos = [];

    for (const pedido of pedidos) {
      try {
        const pedidoBling = await Bling.pedidoVenda(pedido.idpedidovenda);

        const { metodosFrete } = await LogisticaBusiness.adquirirMetodosFrete(pedidoBling);

        const melhorMetodo = await LogisticaBusiness.escolherMelhorMetodo(metodosFrete, pedido);

        pedidoComMetodosEscolhidos.push({
          idpedidovenda: pedidoBling.idpedidovenda,
          metodo: melhorMetodo,
        });

        await models.tbpedidovenda.update(
          {
            fretetransportadora: melhorMetodo.preco,
          },
          {
            where: {
              idpedidovenda: pedido.idpedidovenda,
            },
          }
        );
      } catch (error) {
        console.log(error);
      }
    }

    const idPedidosVenda = pedidoComMetodosEscolhidos.map((pedido) => pedido.idpedidovenda);

    const clientes = await models.tbpedidovenda.findAll({
      attributes: ["idpedidovenda", "cliente"],
      where: {
        idpedidovenda: {
          [Op.in]: idPedidosVenda,
        },
      },
      raw: true,
    });

    const dicionarioClientes = dictionary(clientes, "idpedidovenda");

    const resultadoFinal = pedidoComMetodosEscolhidos.map((pedido) => {
      const servicoFinal =
        pedido.metodo.transportadora === "DLog"
          ? "DLog"
          : pedido.metodo.transportadora + " - " + pedido.metodo.servicoTraduzido;

      const resultado = {
        idpedidovenda: pedido.idpedidovenda,
        cliente: dicionarioClientes[pedido.idpedidovenda].cliente,
        servico: servicoFinal || "",
      };

      return resultado;
    });

    return ok({
      pedidos: resultadoFinal,
    });
  },
};
