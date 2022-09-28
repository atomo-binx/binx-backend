const currency = require("currency.js");

module.exports = {
  // Cria um objeto curreny a partir de um valor com a precisão desejada
  ajustPrecision(value, precision) {
    return currency(value, { precision });
  },

  // Função para formatar um valor, inteiro ou float, numérico ou string em moeda BRL
  BRLString(valor, simbolo = "", minimumFractionDigits = 2, maximumFractionDigits = 6) {
    let formatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(valor);

    if (simbolo != "") {
      return formatado.replace(/\s/g, "").replace("R$", simbolo);
    } else {
      return formatado.replace("R$", "").replace(/\s/g, "");
    }
  },
};
