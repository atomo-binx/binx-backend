const soap = require("soap");
const debug = require("../utils/debug");
const dotenv = require("dotenv");
dotenv.config({ path: "./../../.env" });

const url = "https://www.baudaeletronica.com.br/index.php/api/v2_soap?wsdl=1";

const loginArgs = {
  username: process.env.MAGENTO_USERNAME,
  apiKey: process.env.MAGENTO_API_KEY,
};

console.log("Iniciando");

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
          orderIncrementId: "100180807"
        };

        // Chamada de Método
        client.catalogProductList  (
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
