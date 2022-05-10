const httpResponse = require("../utils/http");
const fs = require("fs").promises;
const xml2js = require("xml2js");

const Produto = require("../models/produto.model");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async decodificaProdutos() {
    let arquivoXml = (await fs.readFile("./src/files/download.xml")).toString();

    let produtos = [];

    await xml2js
      .parseStringPromise(arquivoXml)
      .then(function (result) {
        produtos = result["rss"]["channel"][0]["item"];

        console.log(filename, "Parse do XML para objeto completo");
      })
      .catch(function (err) {
        // Failed
      });

    for (const produto of produtos) {
      const idsku = produto["g:id"][0];
      const urlimagem = produto["g:image_link"][0];
      const urlproduto = produto["link"][0];
      const pesomagento = produto["g:shipping_weight"][0].replace("Kg", "");

      console.log(filename, `Decodificando XML: ${idsku} `);
      await Produto.update(
        {
          urlimagem,
          urlproduto,
          pesomagento,
        },
        {
          where: {
            idsku,
          },
        }
      );
    }

    console.log(filename, "Decodificação de XML finalizada");

    return httpResponse.ok({
      message: "Decodificação de XML finalizada",
    });
  },
};
