const OrdemCompraBusiness = require("../business/ordemcompra.business");

module.exports = {
  async incluirOrdemCompra(req, res, next) {
    try {
      const { idTipo, observacoes } = req.body;

      const resposta = await OrdemCompraBusiness.incluir(idTipo, observacoes);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async listarOrdensCompra(req, res, next) {
    try {
      const { busca, situacao, tipo } = req.query;

      const resposta = await OrdemCompraBusiness.listar(busca, situacao, tipo);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async incluirProduto(req, res, next) {
    try {
      const { idOrdemCompra, produtos } = req.body;

      const resposta = await OrdemCompraBusiness.incluirProduto(idOrdemCompra, produtos);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async lerOrdemCompra(req, res, next) {
    try {
      const { id } = req.params;

      const resposta = await OrdemCompraBusiness.lerOrdemCompra(id);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async atualizarOrdemCompra(req, res, next) {
    try {
      const { id: idOrdemCompra } = req.params;

      const { produtos, orcamentos } = req.body;

      const resposta = await OrdemCompraBusiness.atualizarOrdemCompra(idOrdemCompra, produtos, orcamentos);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
