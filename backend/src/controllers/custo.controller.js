const { custoMedio } = require("../business/custo/custo_medio");

module.exports = {
  async custoMedio(req, res, next) {
    try {
      // Extração dos parâmetros
      let sku = req.query.sku;
      let qntd = parseInt(req.query.quantidade);

      try {
        const resposta = await custoMedio(sku, qntd);

        return res.status(200).json(resposta);
      } catch (error) {
        return res.status(500).json({
          message: error.message,
        });
      }
    } catch (error) {
      next(error);
    }
  },
};
