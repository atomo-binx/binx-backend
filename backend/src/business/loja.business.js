const Loja = require("../models/loja.model");
const http = require("../utils/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  // Lista todos os produtos existentes
  async index() {
    try {
      const lojas = await Loja.findAll();

      return http.ok(lojas);
    } catch (error) {
      console.log(filename, `Erro na aquisição de dados de lojas:  ${error.message}`);

      return http.failure({
        message: `Erro na aquisição de dados de lojas:  ${error.message}`,
      });
    }
  },

  // Leitura de um produto de SKU específico
  async read(req) {
    try {
      const loja = await Loja.findByPk(req.params.idloja);

      if (loja == null) {
        return http.ok({
          message: "nenhuma loja encontrada para o ID especificado.",
        });
      } else {
        return http.ok(loja);
      }
    } catch (error) {
      console.log(filename, `Erro durante aquisição de dados da loja: ${error.message}`);
      return http.failure({
        message: `Erro durante aquisição de dados da loja: ${error.message}`,
      });
    }
  },
};
