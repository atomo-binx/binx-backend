const soap = require("soap");
const moment = require("moment");

const url = process.env.MAGENTO_API_URL;

const loginArgs = {
  username: process.env.MAGENTO_USERNAME,
  apiKey: process.env.MAGENTO_API_KEY,
};

const filename = __filename.slice(__dirname.length + 1) + " -";
const xml2js = require("xml2js");

module.exports = {
  async createClient() {
    return new Promise((resolve, reject) => {
      soap
        .createClientAsync(url)
        .then((client) => {
          console.log(filename, "Sucesso na criação do cliente");
          resolve(client);
        })
        .catch((error) => {
          console.log(
            filename,
            `Erro durante a criação do cliente: ${error.message}`
          );
          reject(error);
        });
    });
  },

  async login(client) {
    return new Promise((resolve, reject) => {
      client
        .loginAsync(loginArgs)
        .then((result) => {
          const sessionId = result[0]["loginReturn"]["$value"];
          console.log(filename, "Session ID:", sessionId);

          resolve(sessionId);
        })
        .catch((error) => {
          console.log("Erro durante o login");
          reject(error);
        });
    });
  },

  async endSession(client, sessionId) {
    return new Promise((resolve, reject) => {
      client
        .endSessionAsync({ sessionId })
        .then(() => {
          console.log(filename, "Sessão finalizada");
          resolve();
        })
        .catch((error) => {
          console.log(filename, "Erro ao finalizar sessão");
          reject(error);
        });
    });
  },

  // Lista de Pedidos de Venda
  async salesOrderList(client, sessionId) {
    return new Promise((resolve, reject) => {
      let dataInicial = moment()
        .subtract(14, "days")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");

      let dataFinal = moment()
        .add(1, "days")
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");

      console.log(filename, "Data Inicial:", dataInicial);
      console.log(filename, "Data Final:", dataFinal);

      const callArgs = {
        sessionId,
        filters: {
          complex_filter: {
            complexObjectArray: [
              {
                key: "created_at",
                value: {
                  key: "from",
                  value: dataInicial,
                },
              },
              {
                key: "created_at",
                value: {
                  key: "to",
                  value: dataFinal,
                },
              },
            ],
          },
        },
      };

      client
        .salesOrderListAsync(callArgs)
        .then((result) => {
          if (result[0]["result"]["item"]) {
            const vendas = result[0]["result"]["item"];
            console.log(filename, "Quantidade de vendas:", vendas.length);

            let decodificado = [];

            for (const venda of vendas) {
              try {
                const idpedido = venda["increment_id"]["$value"];
                const status = venda["status"]["$value"];
                const data = venda["created_at"]["$value"];

                decodificado.push({ idpedido, status, data });
              } catch (error) {
                // console.log(
                //   filename,
                //   "Erro na desestruturação de pedido de venda do Magento"
                // );
              }
            }

            resolve(decodificado);
          }
          reject();
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro durante a chamada 'salesOrderList':",
            error.message
          );
          reject(error);
        });
    });
  },

  // Informações Básicas sobre um Produto
  async catalogProductInfo(client, sessionId, productId) {
    return new Promise((resolve, reject) => {
      const callArgs = {
        sessionId,
        product: productId + " ",
        identifier: "sku",
        attributes: {
          complexObjectArray: {
            key: "additional_attributes",
            value: ["169", 169, "descajax"],
          },
        },
      };

      client
        .catalogProductInfoAsync(callArgs)
        .then((result) => {
          // Converter o resultado de XML para Json
          var parser = new xml2js.Parser({
            ignoreAttrs: true,
            explicitRoot: false,
            mergeAttrs: true,
            explicitArray: false,
          });

          parser.parseStringPromise(result[1]).then((result) => {
            resolve(result["SOAP-ENV:Body"]["ns1:catalogProductInfoResponse"]);
          });
        })
        .catch((error) => {
          console.log(
            filename,
            `Erro durante a chamada 'catalogProductInfo': ${error.message}`
          );
          reject(error);
        });
    });
  },

  // Lista de Imagens de um Produto
  async catalogProductAttributeMediaList(client, sessionId, productId) {
    return new Promise((resolve, reject) => {
      const callArgs = {
        sessionId,
        product: productId + " ",
        identifier: "sku",
      };

      client
        .catalogProductAttributeMediaListAsync(callArgs)
        .then((result) => {
          var parser = new xml2js.Parser({
            ignoreAttrs: true,
            explicitRoot: false,
            mergeAttrs: true,
            explicitArray: false,
          });

          parser.parseStringPromise(result[1]).then(function (result) {
            console.dir(result);
            console.log("Done");

            resolve(
              result["SOAP-ENV:Body"][
                "ns1:catalogProductAttributeMediaListResponse"
              ]
            );
          });
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro durante a chamada 'catalogProductAttributeMediaList':",
            error.message
          );
          reject(error);
        });
    });
  },

  // Lista de Atributos de um Conjunto (SetId)
  async catalogProductAttributeList(client, sessionId, setId) {
    return new Promise((resolve, reject) => {
      const callArgs = {
        sessionId,
        setId,
      };

      client
        .catalogProductAttributeListAsync(callArgs)
        .then((result) => {
          var parser = new xml2js.Parser({
            ignoreAttrs: true,
            explicitRoot: false,
            mergeAttrs: true,
            explicitArray: false,
          });

          parser.parseStringPromise(result[1]).then(function (result) {
            console.dir(result);
            console.log("Done");

            resolve(
              result["SOAP-ENV:Body"]["ns1:catalogProductAttributeListResponse"]
            );
          });
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro durante a chamada 'catalogProductAttributeList':",
            error.message
          );
          reject(error);
        });
    });
  },
};
