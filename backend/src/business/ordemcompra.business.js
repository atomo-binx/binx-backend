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
      order: [["idordemcompra", "desc"]],
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
          attributes: [["idsku", "idSku"], "quantidade"],
          include: [
            {
              model: models.tbproduto,
              attributes: ["nome", "ultimocusto"],
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

    // Alterar o nome do relacionamento "tbordemcompraprodutos" para "produtos"
    Object.assign(ordemCompra, { produtos: ordemCompra.tbordemcompraprodutos });
    delete ordemCompra.tbordemcompraprodutos;

    // Alterar a estrutura do nome do produto de "tbproduto.nome" para "nome"
    ordemCompra.produtos = ordemCompra.produtos.map((produto) => {
      produto.nome = produto.tbproduto.nome;
      produto.ultimoCusto = produto.tbproduto.ultimocusto;
      delete produto.tbproduto;
      return produto;
    });

    // Adquirir os orçamentos, trabalhar a partir daqui

    let orcamentos = [];

    const idOrcamentos = await models.tborcamento.findAll({
      attributes: ["idFornecedor", [Sequelize.col("tbfornecedor.nomefornecedor"), "nomeFornecedor"]],
      where: {
        idordemcompra: idOrdemCompra,
      },
      include: [
        {
          model: models.tbfornecedor,
        },
      ],
      group: [["idfornecedor"]],
      raw: true,
    });

    for (const orcamento of idOrcamentos) {
      const dadosOrcamento = await models.tborcamento.findAll({
        attributes: [
          "idSku",
          "idSituacaoOrcamento",
          [Sequelize.col("tbsituacaoorcamento.nome"), "situacao"],
          "valor",
        ],
        where: {
          idfornecedor: orcamento.idFornecedor,
          idordemcompra: idOrdemCompra,
        },
        include: [
          {
            model: models.tbsituacaoorcamento,
            attributes: [],
          },
          {
            model: models.tbfornecedor,
            attributes: [],
          },
        ],
        raw: true,
      });

      orcamentos.push({
        idFornecedor: orcamento.idFornecedor,
        nomeFornecedor: orcamento.nomeFornecedor,
        produtos: [...dadosOrcamento],
      });
    }

    ordemCompra.orcamentos = orcamentos;

    return ok({
      ordemCompra,
    });
  },
};
