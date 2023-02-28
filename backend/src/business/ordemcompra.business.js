const { models } = require("../modules/sequelize");
const { ok, notFound } = require("../modules/http");
const { Sequelize, Op } = require("sequelize");
const { dictionary } = require("../utils/dict");

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
            id: busca,
          },
        ],
      };
    }

    if (situacao) whereClausule.idsituacaoordemcompra = situacao;
    if (tipo) whereClausule.idtipoordemcompra = tipo;

    const ordensCompra = await models.tbordemcompra.findAll({
      attributes: [
        ["id", "id"],
        "observacoes",
        ["datafinalizacao", "dataFinalizacao"],
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        [Sequelize.col("tbusuario.nome"), "comprador"],
        [Sequelize.col("tbtipoordemcompra.nome"), "tipo"],
        ["createdAt", "data"],
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
      order: [["id", "desc"]],
      raw: true,
    });

    return ok({
      ordensCompra,
    });
  },

  async incluirProduto(idOrdemCompra, produtos) {
    // Incluir registro dos produtos na tabela de ordemdecompraproduto
    const pacoteProdutos = produtos.map((produto) => {
      return {
        idordemcompra: idOrdemCompra,
        idsku: produto.idSku,
        quantidade: produto.quantidade,
      };
    });

    await models.tbordemcompraproduto.bulkCreate(pacoteProdutos, {
      updateOnDuplicate: ["quantidade"],
    });

    return ok({
      message: "Os produtos foram inseridos na ordem de compra informada.",
    });
  },

  async removerProduto(idOrdemCompra, produtos) {},

  async incluirOrcamento(idOrdemCompra, orcamentos) {
    const pacoteOrcamentos = [];

    orcamentos.forEach((orcamento) => {
      orcamento.produtos.forEach((produto) => {
        pacoteOrcamentos.push({
          id: produto.id,
          idordemcompra: idOrdemCompra,
          idsku: produto.idSku,
          idfornecedor: orcamento.idFornecedor,
          idsituacaoorcamento: produto.idSituacaoOrcamento,
          valor: produto.valor,
        });
      });
    });

    await models.tborcamento.bulkCreate(pacoteOrcamentos, {
      updateOnDuplicate: ["idfornecedor", "idsituacaoorcamento", "valor"],
    });
  },

  async lerOrdemCompra(idOrdemCompra) {
    let ordemCompra = await models.tbordemcompra.findByPk(idOrdemCompra, {
      attributes: [
        "id",
        ["idtipoordemcompra", "idTipo"],
        [Sequelize.col("tbtipoordemcompra.nome"), "tipo"],
        ["idsituacaoordemcompra", "idSituacao"],
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        [Sequelize.col("tbusuario.nome"), "comprador"],
        "observacoes",
        ["datafinalizacao", "dataFinalizacao"],
      ],
      include: [
        {
          model: models.tbordemcompraproduto,
          attributes: ["id", "idSku", "quantidade"],
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
      order: [[models.tbordemcompraproduto, "createdAt", "asc"]],
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

    // Separar a lista de ID's dos produtos nessa ordem de compra
    const idProdutosOrdemCompra = ordemCompra.produtos.map((produto) => produto.id);

    // Adquirir os orçamentos
    const orcamentos = await models.tborcamento.findAll({
      attributes: [
        "id",
        [Sequelize.col("tbordemcompraproduto.idsku"), "idSku"],
        "idOrdemCompraProduto",
        "idFornecedor",
        [Sequelize.col("tbfornecedor.nomefornecedor"), "fornecedor"],
        "idSituacaoOrcamento",
        "valor",
      ],
      include: [
        {
          model: models.tbfornecedor,
          attributes: [],
        },
        {
          model: models.tbordemcompraproduto,
          attributes: [],
        },
      ],
      where: {
        idordemcompraproduto: {
          [Op.in]: idProdutosOrdemCompra,
        },
      },
      raw: true,
    });

    ordemCompra.orcamentos = orcamentos;

    // let orcamentos = [];

    // Essa etapa irá retornar todos os fornecedores com orçamentos existentes para essa ordem de compra

    // [
    //   { idFornecedor, nomeFornecedor},
    //   { idFornecedor, nomeFornecedor},
    //   { ... }
    // ]

    // const idFornecedores = await models.tborcamento.findAll({
    //   attributes: ["idFornecedor", [Sequelize.col("tbfornecedor.nomefornecedor"), "nomeFornecedor"]],
    //   include: [
    //     {
    //       model: models.tbordemcompraproduto,
    //       attributes: [],
    //       where: {
    //         idordemcompra: idOrdemCompra,
    //       },
    //     },
    //     {
    //       model: models.tbfornecedor,
    //       attributes: [],
    //     },
    //   ],
    //   group: [["idfornecedor"]],
    //   raw: true,
    // });

    // console.log(idFornecedores);

    // for (const orcamento of idOrcamentos) {
    //   const dadosOrcamento = await models.tborcamento.findAll({
    //     attributes: [
    //       "id",
    //       "idSku",
    //       "idSituacaoOrcamento",
    //       [Sequelize.col("tbsituacaoorcamento.nome"), "situacao"],
    //       "valor",
    //     ],
    //     where: {
    //       idfornecedor: orcamento.idFornecedor,
    //       idordemcompra: idOrdemCompra,
    //     },
    //     include: [
    //       {
    //         model: models.tbsituacaoorcamento,
    //         attributes: [],
    //       },
    //       {
    //         model: models.tbfornecedor,
    //         attributes: [],
    //       },
    //     ],
    //     order: [["createdAt", "asc"]],
    //     raw: true,
    //   });

    //   orcamentos.push({
    //     idFornecedor: orcamento.idFornecedor,
    //     nomeFornecedor: orcamento.nomeFornecedor,
    //     produtos: [...dadosOrcamento],
    //   });
    // }

    // ordemCompra.orcamentos = orcamentos;

    return ok({
      ordemCompra,
    });
  },

  async atualizarOrdemCompra(idOrdemCompra, produtos, orcamentos) {
    // Primeiro rascunho da rotina de atualização de produtos

    // Verificar existência da ordem de compra informada
    const ordemCompra = await models.tbordemcompra.findByPk(idOrdemCompra);

    if (!ordemCompra) {
      return notFound({
        message: "A ordem de compra informada não foi encontrada.",
      });
    }

    // Análise de Produtos

    // Inclusão de novos produtos e atualização das quantidades
    await this.incluirProduto(idOrdemCompra, produtos);

    // Listar os produtos existentes na ordem de compra informada
    const produtosOrdemCompra = await models.tbordemcompraproduto.findAll({
      attributes: ["idSku", "quantidade"],
      where: {
        idordemcompra: idOrdemCompra,
      },
      raw: true,
    });

    // Gerar dicionários de produtos
    const produtosForm = dictionary(produtos, "idSku");

    // Analisar produtos que existam apenas no Binx, e que devem ser removidos
    const produtosRemover = [];

    produtosOrdemCompra.forEach((produto) => {
      if (!produtosForm[produto.idSku]) {
        produtosRemover.push(produto);
      }
    });

    console.log({ produtosRemover });

    // Análise de Orçamentos
    await this.incluirOrcamento(idOrdemCompra, orcamentos);

    return ok({
      produtos,
    });
  },
};
