const { notFound, ok } = require("../modules/http");
const { models } = require("../modules/sequelize");

module.exports = {
  async itensParaPrecificar() {},

  async registrarPrecificacao(idpedidocompra) {
    const pedidoCompra = await models.tbpedidocompra.findByPk(idpedidocompra);

    if (!pedidoCompra) {
      return notFound({
        message: "O pedido de compra informado não foi encontrado.",
      });
    }

    await models.tbpedidocompra.update(
      {
        precificado: 1,
      },
      {
        where: {
          idpedidocompra,
        },
      }
    );

    return ok({
      message: "Precificação registrada com sucesso.",
    });
  },
};
