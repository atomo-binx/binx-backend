const soap = require("soap");
const debug = require("../utils/debug");
const dotenv = require("dotenv");
dotenv.config({ path: "./../../.env" });

const url = "https://www.baudaeletronica.com.br/index.php/api/v2_soap?wsdl=1";

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
    client.login(
      loginArgs,
      function (err, result, rawResponse, soapHeader, rawRequest) {
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
            products: ["1810", "1811", "4010", "7620", "873"],
          };

          // Chamada de Método
          client.catalogInventoryStockItemList(
            callArgs,
            (err, result, rawResponse, soapHeader, rawRequest) => {
              // console.log("Raw request:");
              // console.log(rawRequest);

              if (err) {
                console.log(
                  "Falha na tentativa de chamada de método:",
                  err.message
                );
                // console.log(err);
              } else {
                console.log("Sucesso na tetantiva de chamada de metodo");
                console.log(result);

                const quantidades = [];

                for (const item of result["result"]["item"]) {
                  quantidades.push({
                    sku: item["sku"]["$value"],
                    qtnd: item["qty"]["$value"],
                  });
                }

                console.log(quantidades);

                // const vendas = result["result"]["item"];
                // console.log("Quantidade de vendas:", vendas.length);

                // let decodificado = [];

                // for (const venda of vendas) {
                //   const pedido = venda["increment_id"]["$value"];
                //   const status = venda["status"]["$value"];
                //   decodificado.push({ idpedidoloja: pedido, status: status });
                // }
              }

              client.endSession({ sessionId }, (err, result) => {
                if (err) {
                  console.log(
                    "Erro ao finalizar sessão: (session id)",
                    err.message
                  );
                } else {
                  console.log("Sessão finalizada (session id)");
                  // console.log(result);
                }
              });
            }
          );
        }
      }
    );
  }
});
