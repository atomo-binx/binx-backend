const EmailBusiness = require("../business/email.business");

module.exports = {
  async send(req, res) {
    const status = await EmailBusiness.send();

    if (status) {
      res.status(200).send({
        message: "Procedimento de envio de email finalizado (ok)",
      });
    } else {
      res.status(500).send({
        message: "Procedimento de envio de email finalizado (erro)",
      });
    }
  },

  async sync(req, res) {
    const status = await EmailBusiness.sync();

    if (status) {
      res.status(200).send({
        message: "Procedimento de sincronização de emails executado",
      });
    } else {
      res.status(500).send({
        message: "Erro no procedimento de sincronização de emails",
      });
    }
  },

  async emailDebug(req, res) {
    const resposta = await EmailBusiness.emailDebug(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
