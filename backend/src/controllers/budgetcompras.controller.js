const BudgetComprasBusiness = require("../business/budgetcompras.business.js");

module.exports = {
  async dashboard(req, res, next) {
    try {
      const { mes, ano } = req.query;

      const response = await BudgetComprasBusiness.dashboard(mes, ano);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
