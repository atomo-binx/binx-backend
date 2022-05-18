const ControleCaixaBusiness = require("../business/caixa.business");

const UserIdValidator = require("../validators/usuario/id.rules");

const validation = require("../modules/validation");

module.exports = {
  async listarCaixas(req, res, next) {
    try {
      // const rules = [[userId, UserIdValidator]];

      // const validationResult = validation.run(rules);

      // if (validationResult["status"] === "error") {
      //   return res.status(400).json(validationResult);
      // }

      const response = await ControleCaixaBusiness.listarCaixas();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async criarCaixa(req, res, next) {
    try {
      const token = req.token;

      const response = await ControleCaixaBusiness.criarCaixa(token);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async lerCaixa(req, res, next) {
    try {
      const { id } = req.params;

      const response = await ControleCaixaBusiness.lerCaixa(id);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
