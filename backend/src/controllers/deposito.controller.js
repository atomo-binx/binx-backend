const DepositoBusiness = require("../business/deposito.business");

module.exports = {
  // Lista todos os depósitos existentes
  async index(req, res) {
    const resposta = await DepositoBusiness.index();
    res.status(resposta.statusCode).json(resposta.body);
  },

  // Lista um depósito específico
  async read(req, res) {
    const resposta = await DepositoBusiness.read(req);
    res.status(resposta.statusCode).json(resposta.body);
  },
};
