const currency = require("currency.js");

const { BRLString } = require("../utils/money");

// // Formating with Currency
// const amount = "1000";
// const BRL = (value) => currency(value);

// const total = BRL(amount).add(BRL("0.56"));

// // console.log(BRLString(total, "R$"));
// // console.log(BRLString(total, "R$ "));
// // console.log(BRLString(total));

// console.log(BRLString(100));
// console.log(BRLString(100.21));
// console.log(BRLString(100.2134));
// console.log(BRLString("100.2134"));
// console.log(BRLString("1000000.2134"));

const ultimocusto = "0.019135";
const quantidade = 65;

const valor = currency(ultimocusto, { precision: 6 }).multiply(quantidade, { precision: 6 });

console.log(valor.value, BRLString(valor, "", 2, 3));
