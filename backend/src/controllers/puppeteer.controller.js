const PuppeteerBusiness = require("../business/auth/login.business");

module.exports = {
  async alterarTransportadora(req, res, next) {
    try {
      const response = await PuppeteerBusiness.login();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
