const SincronizaStatusBusiness = require("../business/sincronizaStatus.business");

module.exports = {
  async sync(req, res) {
    const { status, resultado } = await SincronizaStatusBusiness.sync(req, res);

    if (status) {
      res.status(200).send(resultado);
    } else {
      res.status(500).send({
        message: "Erro no procedimento de sincronização de status de pedidos",
      });
    }
  },

  // Função de retrocompatibilidade da sincronização manual de pedidos com o Magento
  // Sincronização através do arquivo .csv exportado do Magento
  async alterarStatusPedido(req, res) {
    const status = await SincronizaStatusBusiness.alterarStatusPedido(req, res);

    if (status) {
      res.status(200).send({
        message: "Status de pedido alterado com sucesso",
      });
    } else {
      res.status(500).send({
        message: "Erro no procedimento de sincronização de status de pedidos",
      });
    }
  },

  async aprovacaoAutomatica(req, res) {
    const resposta = await SincronizaStatusBusiness.aprovacaoAutomatica(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
