const PuppeteerBusiness = require("../business/puppeteer.business");

module.exports = {
  async alterarTransportadora(req, res, next) {
    try {
      PuppeteerBusiness.alterarTransportadora();

      return res.status(200).json({
        message: "A alteração de transportadora foi iniciada em segundo plano.",
      });
    } catch (error) {
      next(error);
    }
  },

  async puppeteerManual(req, res, next) {
    try {
      const response = await PuppeteerBusiness.puppeteerManual();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
