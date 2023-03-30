const BudgetComprasBusiness = require("../business/budgetcompras.business.js");

module.exports = {
  async dashboard(req, res, next) {
    try {
      const response = await BudgetComprasBusiness.dashboard();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
