const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";

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

    pedidos.forEach((pedido) => {});
  },

  async verificaTransportadora(pedido) {
    console.log(filename, "Rodando localmente, tentando alterar transportadora");
    // Realizar chamada de alteração de transportadora
    const transportadora = await this.alterarTransportadora(pedido);

    // Verifica se o procedimento de alteração de transportadora foi executado
    if (transportadora.status) {
      // Atualizar o valor real do frete pago para a transportadora
      pedido["fretetransportadora"] = transportadora.fretetransportadora;
    }
  },
};
