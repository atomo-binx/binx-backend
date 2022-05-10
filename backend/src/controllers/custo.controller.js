const { custoMedio } = require("../business/custo/custo_medio");

const http = require("../utils/http");

module.exports = {
  async custoMedio(req, res, next) {
    try {
      // Extração dos parâmetros
      let sku = req.query.sku;
      let qntd = parseInt(req.query.quantidade);

      // Validação dos parâmetros
      if (!sku) {
        const resposta = http.badRequest({
          message: "É necessário informar o SKU do produto",
        });

        res.status(resposta.statusCode).json(resposta.body);
      }

      if (isNaN(qntd)) {
        const resposta = http.badRequest({
          message: "É necessário informar a quantidade vendida corretamente",
        });

        res.status(resposta.statusCode).json(resposta.body);
      }

      const resposta = await custoMedio(sku, qntd);

      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
