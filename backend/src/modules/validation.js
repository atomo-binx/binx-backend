const { IncorrectParameter } = require("./codes");

function validationError(message) {
  return {
    status: "error",
    code: IncorrectParameter,
    message: message,
  };
}

function run(rules) {
  for (const [field, rule, options] of rules) {
    let required = true;

    if (options) {
      if (Object.prototype.hasOwnProperty.call(options, "required"))
        required = options["required"];
    }

    let result = {};

    // Executa validações individuais caso parâmetro recebido seja uma Array
    if (typeof field === "object") {
      if (field.length >= 1) {
        for (const element of field) {
          result = rule.validate(element, required);
          if (result["status"] === "error") break;
        }
      } else {
        result = rule.validate(null, required);
      }
    } else {
      result = rule.validate(field, required);
    }

    const error = result["status"] === "error";

    if (error) return result;
  }

  return {};
}

module.exports = { validationError, run };
