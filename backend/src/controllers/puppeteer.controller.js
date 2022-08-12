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
};
