const fs = require("fs");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const bling = require("../bling/bling");
const { Op } = require("sequelize");
const { ErrorStatus, OkStatus } = require("../modules/codes");
const { ok, notFound } = require("../modules/http");
const { dictionary } = require("../utils/dict");
const { ordenaPorChave } = require("../utils/sort");
const { replaceAll } = require("../utils/replace");

const Produto = require("../models/produto.model");
const { NotFound } = require("@aws-sdk/client-s3");

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
    // Para utilização com o módulo atualizado "html-pdf-node"
    // return new Promise(async (resolve, reject) => {
    //   htmlToPdf.generatePdf(html, options).then((output) => {
    //     const filename = `etiquetas/${randomUUID()}.pdf`;
    //     fs.writeFileSync(filename, output);
    //     resolve(filename);
    //   });
    // });

    return new Promise((resolve, reject) => {
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
      return notFound({
        status: ErrorStatus,
        code: NotFound,
        message: "O pedido de venda informado não foi encontrado.",
      });
    }

    // Desestrutura apenas os itens da venda
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
        // Remover todos os caracteres especiais da localização
        // Necessário para manter a mesma ordem de produtos que a ordenação do Bling
        const original = produtosBinx[item["idsku"]]["localizacao"] || "";
        const removido = replaceAll(original, /[^A-Za-z\d]+/, "");

        item["localizacao"] = removido;
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

    // Verifica necessidade de aplicar Zoom no arquivo principal de html
    if (process.env.NODE_ENV === "production") {
      html = html.replace("zoom: 1;", `zoom: 0.75;`);
    }

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
      // Configurar corretamente a quebra de linha
      html = html.replace("#QUEBRA_LINHA", "duas-linhas");

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

    // fs.writeFileSync("/tmp/resultado.html", html);

    // Para utilização com o módulo atualizado html-pdf-node
    // const file = { content: html };
    // const filename = await this.pdfCreatePromise(file, options);

    // Para utilização com o módulo antigo html-pdf
    const filename = await this.pdfCreatePromise(html, options);

    return ok({
      status: OkStatus,
      response: {
        filename,
      },
    });
  },

  async etiquetaProduto(idsku, quantidade, etiquetaSimples) {
    // Adquire dados do produto
    const produto = await Produto.findOne({
      attributes: ["idsku", "nome", "urlproduto"],
      where: {
        idsku: idsku,
      },
      raw: true,
    });

    if (!produto) {
      return notFound({
        status: ErrorStatus,
        message: "Não foi encontrado nenhum produto para o SKU informado.",
      });
    }

    // Parametriza o arquivo PDF
    const options = { height: "25mm", width: "83mm" };

    // Carrega o corpo da etiqueta em html
    let html = (
      await fs.promises.readFile("src/etiquetas/etiqueta_corpo.html")
    ).toString();

    // Verifica necessidade de aplicar Zoom no arquivo principal de html
    if (process.env.NODE_ENV === "production") {
      html = html.replace("zoom: 1;", `zoom: 0.75;`);
    }

    // Carrega uma linha de etiqueta em html
    let linha = (
      await fs.promises.readFile("src/etiquetas/etiqueta_linha.html")
    ).toString();

    if (etiquetaSimples) {
      // Neste modo, a quantidade representa o número de cópias desejado

      // Monta a quantidade correta de linhas
      const quantidadeLinhas = Math.floor(quantidade / 2) + (quantidade % 2);

      let linhas = "";

      for (let i = 0; i < quantidadeLinhas; i++) {
        linhas += linha;
      }

      // Insere as linhas geradas no corpo do HTML
      html = html.replace("#LINHAS", linhas);

      // Realiza substituições no corpo HTML da etiqueta
      for (let i = 0; i < quantidade; i++) {
        // Remover campo de quantidade
        html = html.replace("Quantidade: #QNTD", "");

        // Configurar corretamente a quebra de linha
        html = html.replace("#QUEBRA_LINHA", "tres-linhas");

        html = html.replace("#PRODUTO", produto["nome"]);
        html = html.replace("#SKU", produto["idsku"]);

        // Limpar uma etiqueta vazia quando houver
        if (i === quantidade - 1) {
          html = html.replace("#PRODUTO", "");
          html = html.replace("SKU: #SKU", "");
          html = html.replace("QNTD: #QNTD", "");
          html = html.replace("Quantidade: #QNTD", "");
        }
      }
    } else {
      // A quantidade representa a quantidade a ser impressa na etiqueta

      // Insere apenas uma linha no arquivo
      html = html.replace("#LINHAS", linha);

      // Configurar corretamente a quebra de linha
      html = html.replace("#QUEBRA_LINHA", "duas-linhas");

      // Substituições do produto
      html = html.replace("#PRODUTO", produto["nome"]);
      html = html.replace("#SKU", produto["idsku"]);
      html = html.replace("#QNTD", quantidade);

      // Substituições da etiqueta vazia
      html = html.replace("#PRODUTO", "");
      html = html.replace("SKU: #SKU", "");
      html = html.replace("Quantidade: #QNTD", "");
    }

    // Cria o arquivo HTML
    const filename = await this.pdfCreatePromise(html, options);

    return ok({
      status: OkStatus,
      response: {
        filename,
      },
    });
  },

  async removerEtiquetas() {
    const regex = /[.]pdf$/;

    fs.readdirSync("/tmp")
      .filter((f) => regex.test(f))
      .map((f) => fs.unlinkSync("/tmp/" + f));

    return ok({
      status: OkStatus,
      response: {
        message:
          "Arquivos de etiquetas do diretório temporário removidas com sucesso.",
      },
    });
  },

  async etiquetaPersonalizada() {
    // Parametriza o arquivo PDF
    const options = { height: "25mm", width: "83mm" };

    // Carrega o corpo da etiqueta em html
    let html = (
      await fs.promises.readFile(
        "src/etiquetas/etiqueta_corpo personalizada.html"
      )
    ).toString();

    // Verifica necessidade de aplicar Zoom no arquivo principal de html
    if (process.env.NODE_ENV === "production") {
      html = html.replace("zoom: 1;", `zoom: 0.75;`);
    }

    // Carrega uma linha de etiqueta em html
    let linha = (
      await fs.promises.readFile(
        "src/etiquetas/etiqueta_linha personalizada.html"
      )
    ).toString();

    html = html.replace("#LINHAS", linha);

    // Carrega imagem
    var bitmap = fs.readFileSync("../backend/src/etiquetas/imagens/bordas.png");
    const imgBuffer =
      "data:image/png;base64," + new Buffer.from(bitmap).toString("base64");
    html = html.replace("#IMG_1", imgBuffer);

    console.log(imgBuffer);

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
