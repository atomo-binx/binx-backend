const ProdutoBusiness = require("../business/produto.business");

module.exports = {
  async sincronizaProdutos(req, res, next) {
    try {
      const { dataAlteracao, dataInclusao, situacao } = req.query;

      // const rules = [
      //   [dataAlteracao, DataFilterValidator],
      //   [dataInclusao, DataFilterValidator],
      // ];

      // const validationResult = validation.run(rules);

      // if (validationResult["status"] === "error") {
      //   return res.status(400).json(validationResult);
      // }

      ProdutoBusiness.sincronizaProdutos(dataAlteracao, dataInclusao, situacao);

      return res.status(200).json({
        message: "A sincronização de produtos foi iniciada em segundo plano.",
      });
    } catch (error) {
      next(error);
    }
  },

  async callbackProdutos(req, res) {
    const resposta = await ProdutoBusiness.callbackProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  async buscarProdutos(req, res) {
    const resposta = await ProdutoBusiness.buscarProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
