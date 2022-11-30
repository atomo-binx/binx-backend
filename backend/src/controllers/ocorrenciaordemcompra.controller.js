const OcorrenciaOrdemCompraBusiness = require("../business/ocorrenciaordemcompra.business");

module.exports = {
  async incluir(req, res, next) {
    try {
      const idUsuario = req.token.sub;

      const { idOrdemCompra, idSituacao, dataOcorrencia, observacoes } = req.body;

      const resposta = await OcorrenciaOrdemCompraBusiness.incluir(
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

  async listar(req, res, next) {
    try {
      const resposta = await OcorrenciaOrdemCompraBusiness.listar();

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
