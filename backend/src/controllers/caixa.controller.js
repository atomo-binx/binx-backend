const CaixaBusiness = require("../business/caixa.business");

const TrocoValidator = require("../validators/caixa/troco.rules");
const IdValidator = require("../validators/caixa/id.rules");

const validation = require("../modules/validation");

module.exports = {
  async listarCaixas(req, res, next) {
    try {
      // const rules = [[userId, UserIdValidator]];

      // const validationResult = validation.run(rules);

      // if (validationResult["status"] === "error") {
      //   return res.status(400).json(validationResult);
      // }

      const response = await CaixaBusiness.listarCaixas();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async criarCaixa(req, res, next) {
    try {
      const token = req.token;

      const { trocoAbertura } = req.body;

      const rules = [[trocoAbertura, TrocoValidator]];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await CaixaBusiness.criarCaixa(token, trocoAbertura);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async lerCaixa(req, res, next) {
    try {
      const { id } = req.params;

      const rules = [[id, IdValidator]];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await CaixaBusiness.lerCaixa(id);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  async fecharCaixa(req, res, next) {
    try {
      const token = req.token;

      const { idCaixa, valores } = req.body;

      const rules = [[idCaixa, IdValidator]];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await CaixaBusiness.fecharCaixa(token, idCaixa, valores);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
