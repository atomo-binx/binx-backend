const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const Sequelize = require("sequelize");

module.exports = {
  async incluir(idTipo, observacoes) {
    const ordemCompra = await models.tbordemcompra.create({
      idtipoordemcompra: idTipo,
      observacoes: observacoes || null,
    });

    return ok({
      ordemCompra: { ...ordemCompra.dataValues },
    });
  },

  async listar() {
    const ordensCompra = await models.tbordemcompra.findAll({
      attributes: [
        "idordemcompra",
        "observacoes",
        "datafinalizacao",
        "createdAt",
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        [Sequelize.col("tbusuario.nome"), "comprador"],
      ],
      include: [
        {
          model: models.tbsituacaoordemcompra,
          attributes: [],
        },
        {
          model: models.tbusuario,
          attributes: [],
        },
      ],
      raw: true,
    });

    return ok({
      ordensCompra,
    });
  },

  async incluirProduto(idOrdemCompra, produtos) {
    const pacoteProdutos = produtos.map((produto) => {
      return {
        idordemcompra: idOrdemCompra,
        idsku: produto.idSku,
        quantidade: produto.quantidade,
        target: produto.target,
      };
    });

    await models.tbordemcompraproduto.bulkCreate(pacoteProdutos);

    return ok({
      message: "Os produtos foram inseridos na ordem de compra informada.",
    });
  },
};
