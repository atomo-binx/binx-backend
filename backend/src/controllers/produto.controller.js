const ProdutoBusiness = require("../business/produto.business");
const DataFilterValidator = require("../validators/bling/dataFilter.rules");
const validation = require("../modules/validation");

module.exports = {
  // Inicia a sincronização de produtos, pelo frontend ou por chamada lambda
  async iniciaSincronizacao(req, res, next) {
    try {
      const { dataAlteracao, dataInclusao, situacao } = req.query;

      const rules = [
        [dataAlteracao, DataFilterValidator],
        [dataInclusao, DataFilterValidator],
      ];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const resposta = await ProdutoBusiness.iniciaSincronizacao(
        dataAlteracao,
        dataInclusao,
        situacao
      );

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  // Rota para recebe ro Callback de alteração de estoque de produtos
  async callbackProdutos(req, res) {
    const resposta = await ProdutoBusiness.callbackProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  async buscarProdutos(req, res) {
    const resposta = await ProdutoBusiness.buscarProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
