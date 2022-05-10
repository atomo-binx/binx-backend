const http = require("../utils/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

const debug = require("../utils/debug");

module.exports = {
  async callback(req) {
    try {
      const notas = JSON.parse(req.body.data.retorno.notasfiscais);

      // Vefiicar qual a nota correta

      const horario = new Date()
        .toLocaleTimeString("pt-BR")
        .replace(":", "_")
        .replace(":", "_");

      debug.save("callback/nfe_" + horario, JSON.stringify(notas));

      return http.ok({
        message: "Recebendo Callback de Notas Fiscais",
      });
    } catch (error) {
      console.log(filename, `Erro durante callback de NFE: ${error.message}`);
      return http.failure({
        message: `Erro durante callback de NFE: ${error.message}`,
      });
    }
  },
};
