const { ok, failure } = require("../modules/http");

const magento = require("../magento/magento");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async listaPedidosVenda() {
    let resultados = [];

    const client = await magento.createClient();
    const sessionId = await magento.login(client);

    try {
      resultados = await magento.salesOrderList(client, sessionId);
    } catch (error) {
      console.log(
        filename,
        `Erro durante chamada ao Magento: ${error.message}`
      );

      return failure({
        message: `Erro durante chamada ao Magento: ${error.message}`,
      });
    }

    try {
      await magento.endSession(client, sessionId);

      return ok({
        resultados,
      });
    } catch (error) {
      console.log(
        filename,
        "Não foi possível finalizar a sessão, retornando resultados."
      );
      return ok({
        resultados,
      });
    }
  },

  async produto(productId) {
    let resultados = [];

    const client = await magento.createClient();
    const sessionId = await magento.login(client);

    try {
      resultados = await magento.catalogProductInfo(
        client,
        sessionId,
        productId
      );
    } catch (error) {
      console.log(
        filename,
        `Erro durante chamada ao Magento: ${error.message}`
      );

      return failure({
        message: `Erro durante chamada ao Magento: ${error.message}`,
      });
    }

    try {
      await magento.endSession(client, sessionId);

      return ok({
        ...resultados,
      });
    } catch (error) {
      console.log(
        filename,
        "Não foi possível finalizar a sessão, retornando resultados."
      );
      return ok({
        ...resultados,
      });
    }
  },

  async imagens(productId) {
    let resultados = [];

    const client = await magento.createClient();
    const sessionId = await magento.login(client);

    try {
      resultados = await magento.catalogProductAttributeMediaList(
        client,
        sessionId,
        productId
      );
    } catch (error) {
      console.log(
        filename,
        `Erro durante chamada ao Magento: ${error.message}`
      );

      return failure({
        message: `Erro durante chamada ao Magento: ${error.message}`,
      });
    }

    try {
      await magento.endSession(client, sessionId);

      return ok({
        ...resultados,
      });
    } catch (error) {
      console.log(
        filename,
        "Não foi possível finalizar a sessão, retornando resultados."
      );
      return ok({
        ...resultados,
      });
    }
  },

  async conjuntoAtributos(setId) {
    let resultados = [];

    const client = await magento.createClient();
    const sessionId = await magento.login(client);

    try {
      resultados = await magento.catalogProductAttributeList(
        client,
        sessionId,
        setId
      );
    } catch (error) {
      console.log(
        filename,
        `Erro durante chamada ao Magento: ${error.message}`
      );

      return failure({
        message: `Erro durante chamada ao Magento: ${error.message}`,
      });
    }

    try {
      await magento.endSession(client, sessionId);

      return ok({
        ...resultados,
      });
    } catch (error) {
      console.log(
        filename,
        "Não foi possível finalizar a sessão, retornando resultados."
      );
      return ok({
        ...resultados,
      });
    }
  },
};
