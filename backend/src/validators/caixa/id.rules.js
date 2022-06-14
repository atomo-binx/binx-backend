const validator = require("validator");
const { validationError } = require("../../modules/validation");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário informar um ID de caixa.");
    }

    if (input) {
      if (
        !validator.isInt(input.toString(), {
          gt: 0,
        })
      ) {
        return validationError(
          "O ID de caixa informado deve ser um número decimal positivo."
        );
      }
    }

    return {};
  },
};
