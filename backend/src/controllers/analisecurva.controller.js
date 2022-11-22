const AnaliseCurvaBusiness = require("../business/analisecurva.business");

module.exports = {
  async analiseCurva(req, res, next) {
    try {
      const response = await AnaliseCurvaBusiness.analiseCurva();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async exportarAnalise(req, res, next) {
    try {
      const response = await AnaliseCurvaBusiness.exportarAnalise();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
