const soap = require("soap");
const moment = require("moment");

const url = process.env.MAGENTO_API_URL;

const loginArgs = {
  username: process.env.MAGENTO_USERNAME,
  apiKey: process.env.MAGENTO_API_KEY,
};

const filename = __filename.slice(__dirname.length + 1) + " -";

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

  async catalogProductInfo(client, sessionId, productId) {
    return new Promise((resolve, reject) => {
      const callArgs = {
        sessionId,
        product: productId,
      };

      client
        .catalogProductInfoAsync(callArgs)
        .then((result) => {
          console.log(result);
          resolve(result);
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro durante a chamada 'catalogProductInfo':",
            error.message
          );
          reject(error);
        });
    });
  },
};
