const Status = require("../models/status.model");

module.exports = {

  // Lista todos os status de venda existentes
  async index() {
    try {
      const statuses = await Status.findAll({ raw: false });

      return {
        response_status: true,
        statuses: statuses,
      };
    } catch (error) {
      console.log(error.message);

      return {
        response_status: false,
        statuses: [],
      };
    }
  },

  // Leitura de um status de venda específico
  async read(req) {
    try {
      const status = await Status.findByPk(req.params.idstatus);

      if (status == null) {
        return {
          response_status: false,
          status: null,
        };
      } else {
        return {
          response_status: true,
          status: status,
        };
      }
    } catch (error) {
      console.log(error.message);
      return {
        response_status: false,
        status: null,
      };
    }
  },
};
