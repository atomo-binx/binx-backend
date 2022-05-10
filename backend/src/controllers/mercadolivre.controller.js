const MercadoLivreBusiness = require("../business/mercadolivre.business");

module.exports = {
  async inserir(req, res) {
    const resposta = await MercadoLivreBusiness.inserir(req);
    res.status(resposta.statusCode).json(resposta.body);
  },
};
