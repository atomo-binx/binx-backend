const { sequelize, models } = require("../modules/sequelize");
const { ok } = require("../modules/http");

module.exports = {
  async incluir(idUsuario, idOrdemCompra, idSituacao, dataOcorrencia, observacoes) {
    return await sequelize.transaction(async (t) => {
      // Registrar a ocorrência no banco de dados
      const ocorrencia = await models.tbocorrenciaordemcompra.create(
        {
          idordemcompra: idOrdemCompra,
          idsituacaoordemcompra: idSituacao,
          idusuario: idUsuario,
          dataocorrencia: dataOcorrencia,
          observacoes: observacoes || null,
        },
        {
          transaction: t,
        }
      );

      // Adquirir o comprador atualmente atribuído para a ordem de compra
      const ordemCompra = await models.tbordemcompra.findByPk(idOrdemCompra, {
        attributes: ["idcomprador"],
        raw: true,
      });

      // Alterar a situação e o comprador do da ordem de compra no banco de dados
      let comprador = ordemCompra.idcomprador || null;

      // A ordem de compra está voltando para "Em Aberto", remover o comprador
      if (idSituacao === 1) comprador = null;

      // A ordem está sendo assumida, ou seja, "Em Orçamento", atribuir o comprador que irá assumir
      if (idSituacao === 2) comprador = idUsuario;

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
          transaction: t,
        }
      );

      return ok({
        ocorrencia: { ...ocorrencia.dataValues },
      });
    });
  },

  async listar(idOrdemCompra) {
    const ocorrencias = await models.tbocorrenciaordemcompra.findAll({
      where: {
        idordemcompra: idOrdemCompra,
      },
      raw: true,
    });

    return ok({
      ocorrencias,
    });
  },
};
