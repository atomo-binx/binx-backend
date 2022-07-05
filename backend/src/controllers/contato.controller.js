const ContatoBusiness = require("../business/contato.business.js");

module.exports = {
  async sincronizaContatos(req, res, next) {
    try {
      const response = await ContatoBusiness.sincronizaContatos();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
