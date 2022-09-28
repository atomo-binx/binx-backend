const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const LogisticaBusiness = require("../business/logistica.business");
const VendaBusiness = require("../business/venda.business");
const Bling = require("../bling/bling");
const Puppeteer = require("../puppeteer/puppeteer");

module.exports = {
  async alterarTransportadora() {
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

    for (const pedido of pedidos) {
      try {
        const pedidoBling = await Bling.pedidoVenda(pedido.idpedidovenda);

        const { metodosFrete } = await LogisticaBusiness.adquirirMetodosFrete(pedidoBling);

        const melhorMetodo = await LogisticaBusiness.escolherMelhorMetodo(metodosFrete, pedido);

        await Puppeteer.alterarTransportadora(pedido.idpedidovenda.toString(), melhorMetodo.servicoTraduzido);

        await VendaBusiness.sincronizaListaPedidos([pedido.idpedidovenda]);

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
  },
};
