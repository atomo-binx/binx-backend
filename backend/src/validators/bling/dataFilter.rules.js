const validator = require("validator");
const { validationError } = require("../../modules/validation");
const { replaceAll } = require("../../utils/replace");

module.exports = {
  validate(input, required) {
    if (!input && required) {
      return validationError("É necessário informar um filtro de data válido.");
    }

    if (input) {
      // Formato esperado de filtro de data:
      // [XX/XX/XXXX TO XX/XX/XXXX]

      let datas = input.split("TO").map((data) => replaceAll(data, " ", ""));

      console.log(datas);

      if (datas.length != 2) {
        console.log("Falha na regra 1");
        return validationError(
          "O filtro de data deve respeitar o padrão: 'DD/MM/AAAA TO DD/MM/AAAA'"
        );
      }

      if (
        !validator.isDate(datas[0], { format: "DD/MM/YYYY", delimiters: ["/"] })
      ) {
        console.log("Falha na regra 2");

        return validationError(
          "O filtro de data deve respeitar o padrão: 'DD/MM/AAAA TO DD/MM/AAAA'"
        );
      }

      if (
        !validator.isDate(datas[1], { format: "DD/MM/YYYY", delimiters: ["/"] })
      ) {
        console.log("Falha na regra 3");

        return validationError(
          "O filtro de data deve respeitar o padrão: 'DD/MM/AAAA TO DD/MM/AAAA'"
        );
      }
    }

    return {};
  },
};
