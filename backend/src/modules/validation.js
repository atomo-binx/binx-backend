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
      if (options.hasOwnProperty("required")) required = options["required"];
    }

    const result = rule.validate(field, required);

    const error = result["status"] === "error";

    if (error) return result;
  }

  return {};
}

module.exports = { validationError, run };
