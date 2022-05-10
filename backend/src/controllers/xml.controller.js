const XmlBusinnes = require("../business/xml.business");

module.exports = {
  async decodificaProdutos(req, res) {
    const resposta = await XmlBusinnes.decodificaProdutos();
    res.status(resposta.statusCode).json(resposta.body);
  },
};
