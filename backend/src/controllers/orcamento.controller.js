const OrcamentoBusiness = require("../business/orcamento.business");

module.exports = {
  async incluir(req, res, next) {
    try {
      const idUsuario = req.token.sub;

      const { idOrdemCompra, idSku, idFornecedor, idSituacaoOrcamento, valor, previsao } = req.body;

      const resposta = await OrcamentoBusiness.incluir(
        idUsuario,
        idOrdemCompra,
        idSku,
        idFornecedor,
        idSituacaoOrcamento,
        valor,
        previsao
      );

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
