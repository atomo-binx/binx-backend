const ComponexBusines = require("../business/componex.business");

module.exports = {
  async sincronizaCadastro(req, res, next) {
    try {
      const {
        sku,
        exportarDescricao,
        exportarImagens,
        exportarSEO,
        especificacoes,
      } = req.body;

      // const rules = [[idCaixa, IdValidator]];

      // const validationResult = validation.run(rules);

      // if (validationResult["status"] === "error") {
      //   return res.status(400).json(validationResult);
      // }

      const response = await ComponexBusines.sincronizaCadastro(
        sku,
        exportarDescricao,
        exportarImagens,
        exportarSEO,
        especificacoes
      );

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
