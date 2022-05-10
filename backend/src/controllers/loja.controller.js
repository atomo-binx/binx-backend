const LojaBusiness = require("../business/loja.business");

module.exports = {
  // Lista todos as lojas existentes
  async index(req, res) {
    const resposta = await LojaBusiness.index();
    res.status(resposta.statusCode).json(resposta.body);
  },

  // Lista uma loja de ID específico
  async read(req, res) {
    const resposta = await LojaBusiness.read(req);
    res.status(resposta.statusCode).json(resposta.body);
  },
};
