const fs = require("fs");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const bling = require("../bling/bling");
const { Op } = require("sequelize");
const { ErrorStatus, OkStatus } = require("../modules/codes");
const { ok } = require("../modules/http");
const { dictionary } = require("../utils/dict");
const { ordenaPorChave } = require("../utils/sort");

const Produto = require("../models/produto.model");
const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async generateQrCode(content) {
    const qrcodeImage = await QRCode.toDataURL(
      content || "https://baudaeletronica.com.br",
      {
        margin: 1,
      }
    );

    return qrcodeImage;
  },

  async pdfCreatePromise(html, options) {
    return new Promise(async (resolve, reject) => {
      pdf.create(html, options).toFile((err, res) => {
        if (!err) {
          resolve(res.filename);
        } else {
          reject(false);
        }
      });
    });
  },

  async etiquetaPedido(pedidos) {
    // Busca informações do pedido de venda no Bling
    let dadosVenda = null;

    try {
      dadosVenda = await bling.pedidoVenda(pedidos[0]);
    } catch (error) {
      return ok({
        status: ErrorStatus,
        response: {
          message: `O pedido de venda ${pedidos[0]} não foi encontrado.`,
        },
      });
    }

    // Desestrutura apenas os itens da venda, vira uma array de objetos, cada objeto é um item
    const itens = dadosVenda["itens"];

    // Adquire as localizações dos itens no Binx
    let produtosBinx = await Produto.findAll({
      attributes: ["idsku", "localizacao"],
      where: {
        idsku: {
          [Op.in]: itens.map((item) => item["idsku"]),
        },
      },
      raw: true,
    });

    produtosBinx = dictionary(produtosBinx, "idsku", true);

    // Adiciona a localização do Binx ao grupo de itens do Bling
    // Caso o item não tenha sido retornado do Binx, adicionar um campo vazio à localização
    // Aplicar a mesma regra caso o item retornado não tenha localização
    for (const item of itens) {
      if (produtosBinx[item["idsku"]]) {
        item["localizacao"] = produtosBinx[item["idsku"]]["localizacao"] || "";
      } else {
        item["localizacao"] = "";
      }
    }

    // Ordena o grupo de itens com base na localização
    ordenaPorChave(itens, "localizacao");

    // Parametriza o arquivo PDF
    const options = { height: "25mm", width: "83mm" };

    // Carrega o corpo da etiqueta em html
    let html = (
      await fs.promises.readFile("src/etiquetas/etiqueta_corpo.html")
    ).toString();

    // Carrega uma linha de etiqueta em html
    let linha = (
      await fs.promises.readFile("src/etiquetas/etiqueta_linha.html")
    ).toString();

    // Monta a quantidade correta de linhas
    const quantidadeLinhas = Math.floor(itens.length / 2) + (itens.length % 2);

    let linhas = "";

    for (let i = 0; i < quantidadeLinhas; i++) {
      linhas += linha;
    }

    // Realiza substituições no corpo HTML da etiqueta
    html = html.replace("#LINHAS", linhas);

    for (const [index, item] of itens.entries()) {
      const nomeProduto = item["nome"];
      html = html.replace("#PRODUTO", nomeProduto);
      html = html.replace("#SKU", item["idsku"]);
      html = html.replace("#QNTD", item["quantidade"]);
      // Limpar uma etiqueta vazia quando houver
      if (index === itens.length - 1) {
        html = html.replace("#PRODUTO", "");
        html = html.replace("SKU: #SKU", "");
        html = html.replace("QNTD: #QNTD", "");
        html = html.replace("Quantidade: #QNTD", "");
      }
    }

    fs.writeFileSync("/tmp/resultado.html", html);

    // Cria o arquivo HTML
    const filename = await this.pdfCreatePromise(html, options);

    return ok({
      status: OkStatus,
      response: {
        filename,
      },
    });
  },

  async etiquetaProduto(idsku) {
    // Adquire dados do produto
    const produto = await Produto.findOne({
      attributes: ["idsku", "nome", "urlproduto"],
      where: {
        idsku: idsku[0],
      },
      raw: true,
    });

    if (!produto) {
      return ok({
        status: ErrorStatus,
        response: {
          message: "Não foi encontrado nenhum produto para o SKU informado.",
        },
      });
    }

    // Parametriza o arquivo PDF
    const options = { width: "83mm", height: "25mm", orientation: "landscape" };

    // Carrega o corpo da etiqueta em html
    let html = (
      await fs.promises.readFile("src/etiquetas/etiqueta_produto.html")
    ).toString();

    // Realiza substituições no corpo HTML da etiqueta
    html = html.replace("#PRODUTO", produto["nome"]);
    html = html.replace("#SKU", produto["idsku"]);

    html = html.replace("#PRODUTO", produto["nome"]);
    html = html.replace("#SKU", produto["idsku"]);

    // Cria o arquivo HTML
    const filename = await this.pdfCreatePromise(html, options);

    return ok({
      status: OkStatus,
      response: {
        filename,
      },
    });
  },
};
