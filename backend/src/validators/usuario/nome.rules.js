const validator = require("validator");
const { validationError } = require("../../modules/validation");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário inserir um nome de usuário válido.");
    }

    if (input) {
      if (
        !validator.isAlphanumeric(input, "pt-BR", {
          ignore: "' ",
        })
      ) {
        return validationError(
          "O nome de usuário não deve possuir caracteres especiais."
        );
      }

      if (
        !validator.isLength(input, {
          min: 3,
          max: 64,
        })
      ) {
        return validationError(
          "O nome de usuário deve ter entre 3 e 64 caracteres."
        );
      }
    }

    return {};
  },
};
