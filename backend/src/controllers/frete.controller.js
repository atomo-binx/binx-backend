const FreteBusiness = require("../business/frete.business");

module.exports = {
  async calcularFrete(req, res) {
    const { status, resposta } = await FreteBusiness.calcularFrete(req);

    if (status) {
      res.status(200).send(JSON.stringify(resposta));
    } else {
      res.status(500).send({
        message: "Falha no cálculo de frete",
      });
    }
  },
};
