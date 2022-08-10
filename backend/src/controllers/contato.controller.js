const ContatoBusiness = require("../business/contato.business.js");

module.exports = {
  async sincronizarContatos(req, res, next) {
    try {
      const { dataAlteracao, dataInclusao, tipoPessoa } = req.query;

      ContatoBusiness.sincronizarContatos(dataAlteracao, dataInclusao, tipoPessoa);

      return res.status(200).json({
        message: "A sincronização de contatos foi iniciada em segundo plano.",
      });
    } catch (error) {
      next(error);
    }
  },
};
