const validator = require("validator");

module.exports = {
  validate(param) {
    if (!param) {
      return {
        error: "Parâmetro incorreto",
        message: "É necesário inserir um número de página",
      };
    }

    if (
      !validator.isInt(param, {
        gt: 0,
      })
    ) {
      return {
        error: "Parâmetro incorreto",
        message: "O número de página deve ser um número decimal positivo",
      };
    }

    return {};
  },
};
