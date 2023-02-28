const { models } = require("../modules/sequelize");
const { ok, badRequest } = require("../modules/http");

module.exports = {
  async incluir(idUsuario, idOrdemCompra, idSku, idFornecedor, idSituacaoOrcamento, valor, previsao) {
    // Produto "Disponível", porém, sem "valor"
    if (idSituacaoOrcamento === 1 && !valor) {
      return badRequest({
        message: "Para um produto disponível no orçamento, é necessário informar um valor.",
      });
    }

    // Produto "Em Falta", porém com "valor"
    if (idSituacaoOrcamento === 2 && valor) {
      return badRequest({
        message: "Para um produto em falta no orçamento, não deve ser informado um valor.",
      });
    }

    const orcamento = await models.tborcamento.create({
      idordemcompra: idOrdemCompra,
      idsku: idSku,
      idfornecedor: idFornecedor,
      idsituacaoorcamento: idSituacaoOrcamento,
    });

    return ok({
      message: "Alive",
    });
  },
};
