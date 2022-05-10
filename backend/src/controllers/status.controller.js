const StatusBusiness = require("../business/status.business");

module.exports = {
  // Lista todos os status de venda existentes
  async index(req, res) {
    const { response_status, statuses } = await StatusBusiness.index();

    if (response_status) {
      res.status(200).send(JSON.stringify(statuses));
    } else {
      res.status(500).send({
        message: "Falha na aquisição de status",
      });
    }
  },

  // Lista um status de venda específico
  async read(req, res) {
    const { response_status, status } = await StatusBusiness.read(req);

    if (response_status) {
      res.status(200).send(JSON.stringify(status));
    } else {
      res.status(404).send({
        message: "Status não encontrado ou falha no processamento",
      });
    }
  },
};
