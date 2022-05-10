const soap = require("soap");
const debug = require("../utils/debug");
const dotenv = require("dotenv");
dotenv.config({ path: "./../../.env" });

const url = process.env.MAGENTO_API_URL;

const loginArgs = {
  username: process.env.MAGENTO_USERNAME,
  apiKey: process.env.MAGENTO_API_KEY,
};

// Criação do Client
soap.createClient(url, function (err, client) {
  if (err) {
    console.log("Erro na criação do client:", err.message);
  } else {
    // Realização de Login/Session
    client.login(loginArgs, function (err, result, rawResponse, soapHeader, rawRequest) {
      if (err) {
        console.log("Falha na autenticação:", err.message);
      } else {
        console.log("Login realizado");
        // console.log(result);

        const sessionId = result["loginReturn"]["$value"];
        console.log("Session ID:", sessionId);

        // Parâmetros para chamada de método
        const callArgs = {
          sessionId,
          filters: {
            complex_filter: {
              complexObjectArray: [
                {
                  key: "order_id",
                  value: {
                    key: "eq",
                    value: "95056",
                  },
                },
              ],
            },
          },
        };

        // Chamada de Método
        client.salesOrderInvoiceList(
          callArgs,
          (err, result, rawResponse, soapHeader, rawRequest) => {
            // console.log("Raw request:");
            // console.log(rawRequest);

            if (err) {
              console.log("Falha na tentativa de chamada de método:", err.message);
              // console.log(err);
            } else {
              console.log("Sucesso na tetantiva de chamada de metodo");
              console.log(result);

              // const venda = result["result"]["item"][0];
              // console.log(venda);

              console.log("Dados do Pagamento:");
              
              const pagamento = result["result"]["item"];
              console.log(pagamento);
            }

            // Finaliza sessão para o Session ID
            client.endSession({ sessionId }, (err, result) => {
              if (err) {
                console.log("Erro ao finalizar sessão: (session id)", err.message);
              } else {
                console.log("Sessão finalizada (session id)");
                // console.log(result);
              }
            });
          }
        );
      }
    });
  }
});
