const validator = require("validator");

module.exports = {
  validar(param) {
    if (!param) {
      return {
        error: "Parâmetro incorreto",
        message: "É necesário inserir um motivo de precificação",
      };
    }

    if (
      !validator.isInt(param, {
        gt: 0,
      })
    ) {
      return {
        error: "Parâmetro incorreto",
        message: "O motivo de precificação deve ser um número decimal positivo",
      };
    }

    return {};
  },
};
