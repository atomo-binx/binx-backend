const PuppeteerBusiness = require("../business/puppeteer.business");

module.exports = {
  async alterarTransportadora(req, res, next) {
    try {
      const response = await PuppeteerBusiness.alterarTransportadora();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
