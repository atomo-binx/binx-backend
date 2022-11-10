const neatCsv = require("neat-csv");
const fs = require("fs");

async function rotina() {
  const arquivoCsv = fs.readFileSync("./importa.csv", "utf8");

  const parsedCsv = await neatCsv(arquivoCsv);

  console.log(parsedCsv[0]);
}

rotina();
