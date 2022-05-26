const validator = require("validator");
const { validationError } = require("../../modules/validation");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário informar um valor de troco.");
    }

    if (input) {
      if (!validator.isDecimal(input.toString())) {
        return validationError("O valor inserido de troco não é válido.");
      }
    }

    return {};
  },
};
