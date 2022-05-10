const neatCsv = require("neat-csv");
const fs = require("fs");

const Produto = require("../models/produto.model");

const http = require("../utils/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async ultimocusto() {
    console.log(filename, "Iniciando parse do arquivo .csv");

    let arquivoCsv = "";

    try {
      arquivoCsv = fs.readFileSync("./src/files/ultimocusto.csv", "utf8");
    } catch (err) {
      console.error(filename, "Erro na leitura do arquivo CSV:", err.message);
    }

    const parsedCsv = await neatCsv(arquivoCsv);

    let produtos = [];

    for (const produto of parsedCsv) {
      produtos.push({
        idsku: produto["idsku;ultimocusto"].split(";")[0],
        ultimocusto: produto["idsku;ultimocusto"].split(";")[1],
      });
    }

    console.log(filename, "Iniciando updates");
    await Produto.bulkCreate(produtos, {
      updateOnDuplicate: ["ultimocusto"],
    });

    console.log(filename, "Rotina finalizada");

    return http.ok({
      message: "ok",
    });
  },
};
