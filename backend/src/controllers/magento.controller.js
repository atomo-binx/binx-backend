const MagentoBusiness = require("../business/magento.business");

module.exports = {
  async listaPedidosVenda(req, res, next) {
    try {
      const response = await MagentoBusiness.listaPedidosVenda();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async produto(req, res, next) {
    try {
      const { productId } = req.query;

      const response = await MagentoBusiness.produto(productId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
