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

    // pedidos.forEach((pedido) => {

    // });
  },

  async verificaTransportadora(pedido) {
    if (
      pedido.transportadora === "Binx" &&
      pedido.idstatusvenda != 12 &&
      pedido.idstatusvenda != 9
    ) {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        "Necessário atualizar método de transporte do pedido."
      );

      // Iremos tentar alterar a transportadora, salvar o alias original do pedido
      // Essa alteração é realizada diretamente no objeto passado como parâmetro
      pedido["alias"] = pedido.servico;

      // TEMP:
      // Alterar a transportadora apenas se rodando localmente
      let port = process.env.PORT;
      if (port == "" || port == null) {
        console.log(filename, "Rodando localmente, tentando alterar transportadora");
        // Realizar chamada de alteração de transportadora
        const transportadora = await this.alterarTransportadora(pedido);

        // Verifica se o procedimento de alteração de transportadora foi executado
        if (transportadora.status) {
          // Atualizar o valor real do frete pago para a transportadora
          pedido["fretetransportadora"] = transportadora.fretetransportadora;
        }
      } else {
        console.log(filename, "Rodando na AWS, pulando alterando de transportadora");
      }
    } else {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        "Não é necessário realizar modificação de transportadora"
      );
    }
  },
};
