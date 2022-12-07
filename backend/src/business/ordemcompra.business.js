const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const { Sequelize, Op } = require("sequelize");

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

  async listar(busca, situacao, tipo) {
    let whereClausule = {};

    if (busca) {
      whereClausule = {
        [Op.or]: [
          {
            observacoes: {
              [Op.substring]: busca,
            },
          },
          {
            idordemcompra: busca,
          },
        ],
      };
    }

    if (situacao) whereClausule.idsituacaoordemcompra = situacao;
    if (tipo) whereClausule.idtipoordemcompra = tipo;

    const ordensCompra = await models.tbordemcompra.findAll({
      attributes: [
        ["idordemcompra", "idOrdemCompra"],
        "observacoes",
        ["datafinalizacao", "dataFinalizacao"],
        ["createdAt", "data"],
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        [Sequelize.col("tbusuario.nome"), "comprador"],
        [Sequelize.col("tbtipoordemcompra.nome"), "tipo"],
      ],
      where: whereClausule,
      include: [
        {
          model: models.tbsituacaoordemcompra,
          attributes: [],
        },
        {
          model: models.tbtipoordemcompra,
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

  async lerOrdemCompra(idOrdemCompra) {
    let ordemCompra = await models.tbordemcompra.findByPk(idOrdemCompra, {
      attributes: [
        ["idordemcompra", "idOrdemCompra"],
        [Sequelize.col("tbtipoordemcompra.nome"), "tipo"],
        ["idtipoordemcompra", "idTipo"],
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        ["idsituacaoordemcompra", "idSituacao"],
        [Sequelize.col("tbusuario.nome"), "comprador"],
        "observacoes",
        ["datafinalizacao", "dataFinalizacao"],
      ],
      include: [
        {
          model: models.tbordemcompraproduto,
          attributes: [["idsku", "idSku"], "quantidade", "target"],
          include: [
            {
              model: models.tbproduto,
              attributes: ["nome"],
            },
          ],
        },
        {
          model: models.tbsituacaoordemcompra,
          attributes: [],
        },
        {
          model: models.tbtipoordemcompra,
          attributes: [],
        },
        {
          model: models.tbusuario,
          attributes: [],
        },
      ],
    });

    ordemCompra = JSON.parse(JSON.stringify(ordemCompra));

    Object.assign(ordemCompra, { produtos: ordemCompra.tbordemcompraprodutos });

    delete ordemCompra.tbordemcompraprodutos;

    return ok({
      ordemCompra,
    });
  },
};
