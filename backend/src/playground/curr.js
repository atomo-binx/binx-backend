const currency = require("currency.js");

const { BRLString } = require("../utils/money");

// Formating with Currency
const amount = "1000";
const BRL = (value) => currency(value);

const total = BRL(amount).add(BRL("0.56"));

// console.log(BRLString(total, "R$"));
// console.log(BRLString(total, "R$ "));
// console.log(BRLString(total));

console.log(BRLString(100));
console.log(BRLString(100.21));
console.log(BRLString(100.2134));
console.log(BRLString("100.2134"));
console.log(BRLString("1000000.2134"));
