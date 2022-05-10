const PlaygroundBusiness = require("../business/playground.business");

module.exports = {
  async ultimocusto(req, res) {
    const resposta = await PlaygroundBusiness.ultimocusto(req);
    res.status(resposta.statusCode).json(resposta.body);
  },
};
