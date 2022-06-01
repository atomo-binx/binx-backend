const sequelizeBusiness = require("../business/sequelize.business");

module.exports = {
  async connection(req, res, next) {
    try {
      const response = await sequelizeBusiness.connection();
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async generate(req, res, next) {
    try {
      const response = await sequelizeBusiness.generate();
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
