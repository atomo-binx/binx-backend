const MinMaxBusiness = require("../business/minmax.business");

module.exports = {
  async minmax(req, res) {
    const { status, response } = await MinMaxBusiness.minmax();

    if (status) {
      res.status(200).send(JSON.stringify(response));
    } else {
      res.status(404).send({
        message: "Erro no processamento.",
      });
    }
  },

  async exportarMinMax(req, res) {
    const { status, response } = await MinMaxBusiness.exportarMinMax();

    if (status) {
      res.download(response);
    } else {
      res.status(404).send({
        message: "Erro no processamento.",
      });
    }
  },

  async exportarBinxBling(req, res) {
    const { status, response } = await MinMaxBusiness.exportarBinxBling(req);

    if (status) {
      res.status(200).send(JSON.stringify(response));
    } else {
      res.status(404).send({
        message: "Erro no processamento.",
      });
    }
  },
};
