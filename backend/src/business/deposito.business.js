const Deposito = require("../models/deposito.model");

const http = require("../utils/http");
const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  // Lista todos os depósitos existentes
  async index() {
    try {
      const depositos = await Deposito.findAll({ raw: false });

      return http.ok(depositos);
    } catch (error) {
      console.log(filename, `Erro ao listar depósitos: ${error.message}`);

      return http.failure({
        message: `Erro ao listar depósitos: ${error.message}`,
      });
    }
  },

  // Leitura de um depósito específico
  async read(req) {
    try {
      const deposito = await Deposito.findByPk(req.params.id);

      if (deposito == null) {
        return http.ok({
          message: "Nenhum depósito encontrado para o ID especificado.",
        });
      } else {
        return http.ok(deposito);
      }
    } catch (error) {
      console.log(
        filename,
        `Erro durante a busca por depósito: ${error.message}`
      );
      return http.failure({
        message: `Erro durante a busca por depósito: ${error.message}`,
      });
    }
  },
};
