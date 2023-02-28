const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");

module.exports = {
  async listar() {
    const fornecedores = await models.tbfornecedor.findAll({
      attributes: ["idFornecedor", "nomeFornecedor"],
    });

    return ok({
      fornecedores,
    });
  },
};
