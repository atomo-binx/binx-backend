const OcorrenciaOrdemCompraBusiness = require("../business/ocorrenciaordemcompra.business");

module.exports = {
  async incluir(req, res, next) {
    try {
      const idUsuario = req.token.sub;

      const { idOrdemCompra, idSituacao, observacoes } = req.body;

      const resposta = await OcorrenciaOrdemCompraBusiness.incluir(
        idUsuario,
        idOrdemCompra,
        idSituacao,
        observacoes
      );

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async listar(req, res, next) {
    try {
      const { idOrdemCompra } = req.query;

      const resposta = await OcorrenciaOrdemCompraBusiness.listar(idOrdemCompra);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
