const filename = __filename.slice(__dirname.length + 1) + " -";
const http = require("../utils/http");

const Produto = require("../models/produto.model");

const fs = require("fs");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const bling = require("../bling/bling");

module.exports = {
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

  async etiquetaPedido(req) {
    try {
      const pedido = req.query.pedido;

      // Busca informações do produto do banco de dados
      let venda = await bling.pedidoVenda(pedido);

      // Desestrutura apenas os itens da venda (array de objetos)
      let itens = venda["itens"];

      console.log(venda);

      return http.ok("filename");
    } catch (error) {
      console.log(
        filename,
        `Erro ao realizar procedimento de geração de etiqueta: ${error.message}`
      );

      return http.failure({
        message: `Erro ao realizar procedimento de geração de etiqueta: ${error.message}`,
      });
    }
  },

  async etiquetaProduto(req) {
    try {
      const sku = req.query.sku;

      // Busca informações do pedido
      let produto = await Produto.findAll({
        attributes: ["idsku", "nome", "urlproduto"],
        where: {
          idsku: sku,
        },
        raw: true,
      });

      if (produto.length == 0) {
        return http.badRequest({
          message: "Não foi encontrado nenhum produto para o SKU informado",
        });
      }

      produto = produto[0];

      // Gera QRCode com a URL do produto
      const qrcodeImage = await QRCode.toDataURL(produto["urlproduto"], {
        margin: 1,
      });

      // Parametriza o arquivo PDF
      const options = { width: "83mm", height: "25mm", orientation: "landscape" };

      // Carrega o corpo da etiqueta em html
      let html = (
        await fs.promises.readFile("src/etiquetas/etiqueta_produto.html")
      ).toString();

      // Realiza substituições no corpo HTML da etiqueta
      html = html.replace("#PRODUTO", produto["nome"]);
      html = html.replace("#SKU", produto["idsku"]);
      html = html.replace("./qrcode_teste.png", qrcodeImage);
      html = html.replace("#PEDIDO", "110110");
      html = html.replace("#QNTD", "32");

      html = html.replace("#PRODUTO", produto["nome"]);
      html = html.replace("#SKU", produto["idsku"]);
      html = html.replace("./qrcode_teste.png", qrcodeImage);
      html = html.replace("#PEDIDO", "110110");
      html = html.replace("#QNTD", "32");

      // Cria o arquivo HTML
      const filename = await this.pdfCreatePromise(html, options);

      return http.ok(filename);
    } catch (error) {
      console.log(
        filename,
        `Erro ao realizar procedimento de geração de etiqueta: ${error.message}`
      );

      return http.failure({
        message: `Erro ao realizar procedimento de geração de etiqueta: ${error.message}`,
      });
    }
  },
};
