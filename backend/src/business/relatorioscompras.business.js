const { ok } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");

module.exports = {
  async relatorioGeral() {
    const resposta = await this.querySituacaoEstoque();

    return ok({
      resposta: resposta,
    });
  },

  async querySituacaoEstoque() {
    const resultado = await models.tbproduto.findAll({
      attributes: ["idsku", "nome", "curva"],
      include: [
        {
          model: models.tbprodutoestoque,
          attributes: ["minimo", "maximo", "quantidade"],
          where: {
            idestoque: "7141524213",
          },
        },
      ],
      where: {
        idsku: {
          [Op.regexp]: "^[0-9]+$",
        },
        situacao: 1,
      },
      nest: true,
      raw: true,
    });

    console.log(resultado);

    return resultado;
  },
};
