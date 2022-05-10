const MargemBusiness = require("../business/margem.business");

module.exports = {
  async margemProposta(req, res) {
    const { status, resposta } = await MargemBusiness.margemProposta(req);

    if (status) {
      res.status(200).send(JSON.stringify(resposta));
    } else {
      res.status(500).send({
        message: "Falha no cálculo de margem de proposta comercial",
      });
    }
  },

  async margemPedido(req, res) {
    // const { status, resposta } = await MargemBusiness.calcularFrete(req);

    if (status) {
      res.status(200).send(JSON.stringify(resposta));
    } else {
      res.status(500).send({
        message: "Falha no cálculo de margem de proposta comercial",
      });
    }
  },

  async salvaMargemProposta(req, res) {
    // const { status, resposta } = await MargemBusiness.calcularFrete(req);

    if (status) {
      res.status(200).send(JSON.stringify(resposta));
    } else {
      res.status(500).send({
        message: "Falha no cálculo de margem de proposta comercial",
      });
    }
  },

  async salvaMargemPedido(req, res) {
    // const { status, resposta } = await MargemBusiness.calcularFrete(req);

    if (status) {
      res.status(200).send(JSON.stringify(resposta));
    } else {
      res.status(500).send({
        message: "Falha no cálculo de margem de proposta comercial",
      });
    }
  },
};
