const { models } = require("../modules/sequelize");

const { ok, failure } = require("../modules/http");
const bling = require("../bling/bling");
const componex = require("../componex/componex");
const magento = require("../magento/magento");
const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async sincronizaCadastro(sku) {
    try {
      console.log(
        filename,
        "Iniciando migração de produto para a Loja Integrada"
      );

      // 1 - Adquirir os dados do produto no Bling para obter o vínculo com a Loja Integrada
      const produtoBling = await bling.produto(sku, "203426320");

      // 2 - Adquirir os dados do produto no Magento
      const client = await magento.createClient();
      const sessionId = await magento.login(client);

      const produtoMagento = await magento.catalogProductInfo(
        client,
        sessionId,
        sku
      );

      const imagensMagento = await magento.catalogProductAttributeMediaList(
        client,
        sessionId,
        sku
      );

      await magento.endSession(client, sessionId);

      // 3 - Exportar as imagens
      let imagens = [];

      // A API do Magento retorna objetos diferentes dependendo da quantidade de imagens cadastras
      // Retorna uma Array caso tenha mais uma imagem cadastrada, caso contrário, um objeto
      // Identificar as duas situações e converter ambas para uma array
      if (Array.isArray(imagensMagento.result.item)) {
        imagens = imagensMagento.result.item.map((item) => item);
      } else {
        imagens = [imagensMagento.result.item];
      }

      for (const imagem of imagens) {
        if (imagem.exclude === "0") {
          const principal = imagem.position === "1" ? true : false;

          // await componex.cadastrarImagens(
          //   imagem.url,
          //   produtoBling.idProdutoLoja,
          //   principal,
          //   parseInt(imagem.position)
          // );
        }
      }

      // 4 - Exportar dados do produto

      // Manter essas variáveis com os mesmos nomes de exportação para a Loja Integrada
      let ativo = produtoMagento.info.status === 1 ? "true" : "false";
      let descricao_completa = produtoMagento.info.description;

      // Acrescenta modificadores de tamanho e fonte a descrição
      const head = `<span style="font-size: 14px;"><span style="font-family:Arial,Helvetica,sans-serif;">`;
      const tail = `</span></span>`;
      descricao_completa = head + descricao_completa + tail;

      // Montar o objeto de exportação para a Loja Integrada
      const exportarLojaIntegrada = {
        ativo,
        descricao_completa,
        categorias: [],
      };

      await componex.alterarProduto(
        produtoBling.idProdutoLoja,
        exportarLojaIntegrada
      );

      return ok({
        message: "ok",
      });
    } catch (error) {
      return failure({
        message: error.message,
      });
    }
  },
};
