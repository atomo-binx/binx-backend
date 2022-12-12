const FornecedorBusiness = require("../business/fornecedor.business");

module.exports = {
  async listar(req, res, next) {
    try {
      const resposta = await FornecedorBusiness.listar();

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },
};
