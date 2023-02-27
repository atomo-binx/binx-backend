const PuppeteerBusiness = require("../business/puppeteer.business");

module.exports = {
  async puppeteerManual(req, res, next) {
    try {
      const response = await PuppeteerBusiness.puppeteerManual();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
