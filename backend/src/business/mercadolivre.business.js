const neatCsv = require("neat-csv");
const fs = require("fs");

const AnunciosMercadoLivre = require("../models/anunciosml.model");

const http = require("../utils/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async inserir() {
    console.log(filename, "Iniciando parse do arquivo .csv");

    let arquivoCsv = "";

    try {
      arquivoCsv = fs.readFileSync("./src/files/anunciosml.csv", "utf8");
    } catch (err) {
      console.error(filename, "Erro na leitura do arquivo CSV:", err.message);
    }

    const parsedCsv = await neatCsv(arquivoCsv);

    let anuncios = [];

    // idanuncio, idsku, titulo, preco, tipoanuncio, tarifa, situacao, idloja, taxa

    const key =
      "idanuncio;idsku;titulo;preco;tipoanuncio;tarifa;situacao;idloja;taxa";

    for (const anuncio of parsedCsv) {
      const splited = anuncio[key].split(";");

      let tipo = splited[4] || "";

      anuncios.push({
        idanuncio: splited[0],
        idsku: splited[1],
        titulo: splited[2],
        preco: splited[3],
        tipoanuncio: tipo.includes("ssico") ? "Clássico" : "Premium",
        tarifa: splited[5],
        situacao: splited[6],
        idloja: splited[7],
        taxa: splited[8],
      });
    }

    // console.log(anuncios);

    console.log(filename, "Iniciando updates");

    // await AnunciosMercadoLivre.bulkCreate(anuncios);

    let falhas = [];

    for (const anuncio of anuncios) {
      try {
        await AnunciosMercadoLivre.upsert(anuncio);
      } catch (error) {
        falhas.push(anuncio);
      }
    }

    console.log(filename, "Rotina finalizada");

    console.log("Quantidade de falhas:", falhas);
    console.log(falhas);

    return http.ok({
      message: "ok",
    });
  },
};
