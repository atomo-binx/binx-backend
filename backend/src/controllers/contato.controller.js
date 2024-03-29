const ContatoBusiness = require("../business/contato.business.js");

module.exports = {
  async sincronizarContatos(req, res, next) {
    try {
      const {
        dataAlteracao,
        dataInclusao,
        tipoPessoa,
        unidadeTempo,
        quantidadeTempo,
        tipoSincronizacao,
        sincronizarTudo,
        contatos,
      } = req.query;

      const arrayContatos = contatos ? contatos.split(",").map((element) => element.trim()) : null;

      ContatoBusiness.sincronizarContatos(
        dataAlteracao,
        dataInclusao,
        tipoPessoa,
        unidadeTempo,
        quantidadeTempo,
        tipoSincronizacao,
        sincronizarTudo,
        arrayContatos
      );

      return res.status(200).json({
        message: "A sincronização de contatos foi iniciada em segundo plano.",
      });
    } catch (error) {
      next(error);
    }
  },

  async incluir(req, res, next) {
    try {
      const contato = req.body;

      const resposta = await ContatoBusiness.incluir(contato);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
