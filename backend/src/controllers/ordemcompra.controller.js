const OrdemCompraBusiness = require("../business/ordemcompra.business");

module.exports = {
  async incluir(req, res, next) {
    try {
      const { idTipo, observacoes } = req.body;

      const resposta = await OrdemCompraBusiness.incluir(idTipo, observacoes);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async incluirOcorrencia(req, res, next) {
    try {
      const idUsuario = req.token.sub;

      const { idOrdemCompra, idSituacao, dataOcorrencia, observacoes } = req.body;

      const resposta = await OrdemCompraBusiness.incluirOcorrencia(
        idUsuario,
        idOrdemCompra,
        idSituacao,
        dataOcorrencia,
        observacoes
      );

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
