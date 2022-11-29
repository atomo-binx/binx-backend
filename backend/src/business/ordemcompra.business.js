const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");

module.exports = {
  async incluir(idTipo, observacoes) {
    const ordemCompra = await models.tbordemcompra.create({
      idtipoordemcompra: idTipo,
      observacoes: observacoes || null,
    });

    return ok({
      ordemCompra: { ...ordemCompra.dataValues },
    });
  },

  async incluirOcorrencia(idUsuario, idOrdemCompra, idSituacao, dataOcorrencia, observacoes) {
    // Registrar a ocorrência no banco de dados
    const ocorrencia = await models.tbocorrenciaordemcompra.create({
      idordemcompra: idOrdemCompra,
      idsituacaoordemcompra: idSituacao,
      idusuario: idUsuario,
      dataocorrencia: dataOcorrencia,
      observacoes: observacoes || null,
    });

    // Alterar a situação e o comprador do da ordem de compra no banco de dados
    let comprador;

    // A ordem de compra está voltando para "Em Aberto", remover o comprador
    if (idSituacao === 1) comprador = null;

    // A ordem de compra está passando de "Em Aberto" para algum outro status, atualizar comprador
    if (idSituacao !== 1) comprador = idUsuario;

    // Atualizar o modelo de ordem de compra
    await models.tbordemcompra.update(
      {
        idsituacaoordemcompra: idSituacao,
        idcomprador: comprador,
      },
      {
        where: {
          idordemcompra: idOrdemCompra,
        },
      }
    );

    return ok({
      ocorrencia: { ...ocorrencia.dataValues },
    });
  },
};
