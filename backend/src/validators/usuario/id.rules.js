const validator = require("validator");
const { validationError } = require("../../modules/validation");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário inserir um ID de usuário válido.");
    }

    if (input) {
      if (!validator.isUUID(input)) {
        return validationError(
          "O ID de usuário informado não é um UUID válido."
        );
      }
    }

    return {};
  },
};
