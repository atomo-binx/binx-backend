const NfeBusiness = require("../business/nfe.business");

module.exports = {
  async callback(req, res) {
    const resposta = await NfeBusiness.callback(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
