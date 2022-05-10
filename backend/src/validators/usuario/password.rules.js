const validator = require("validator");
const { validationError } = require("../../modules/validation");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário inserir uma senha válida.");
    }

    if (input) {
      if (!validator.isLength(input, { min: 8, max: 32 })) {
        return validationError("A senha deve ter entre 8 e 32 caracteres.");
      }

      if (validator.contains(input, " ")) {
        return validationError(
          "A senha informada não deve possuir espaços em branco."
        );
      }

      if (
        !validator.isAlphanumeric(input, "pt-BR", {
          ignore: "~`!@#$%^&*()_-+={[}]|:;\"'<,>.?/",
        })
      ) {
        return validationError(
          `Apenas os seguintes caracteres especiais são permitidos: ~\`!@#$%^&*()_-+={[}]|:;\"'<,>.?/`
        );
      }
    }

    return {};
  },
};
