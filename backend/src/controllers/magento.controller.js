const MagentoBusiness = require("../business/magento.business");

module.exports = {
  async produto(req, res, next) {
    try {
      const { productId } = req.query;

      const response = await MagentoBusiness.produto(productId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async produtos(req, res, next) {
    try {
      const response = await MagentoBusiness.produtos();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async imagensProduto(req, res, next) {
    try {
      const { productId } = req.query;

      const response = await MagentoBusiness.imagens(productId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async conjuntoAtributos(req, res, next) {
    try {
      const { setId } = req.query;

      const response = await MagentoBusiness.conjuntoAtributos(setId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async pedidoVenda(req, res, next) {
    try {
      const { orderIncrementId } = req.query;

      const response = await MagentoBusiness.pedidoVenda(orderIncrementId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async pedidosVenda(req, res, next) {
    try {
      const response = await MagentoBusiness.listaPedidosVenda();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
