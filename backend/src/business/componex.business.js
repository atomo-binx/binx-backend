const { models } = require("../modules/sequelize");

const { ok } = require("../modules/http");
const bling = require("../bling/bling");
const magento = require("../magento/magento");

module.exports = {
  async sincronizaCadastro(sku) {
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

    // 3 - Exportar as imagens do produto

    // 4 - Exportar os dados do produto

    return ok({
      message: "ok",
    });
  },
};
