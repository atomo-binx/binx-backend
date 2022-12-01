const { sequelize, models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const Sequelize = require("sequelize");

module.exports = {
  async incluir(idUsuario, idOrdemCompra, idSituacao, observacoes) {
    idSituacao = parseInt(idSituacao);

    return await sequelize.transaction(async (t) => {
      // Registrar a ocorrência no banco de dados
      const ocorrencia = await models.tbocorrenciaordemcompra.create(
        {
          idordemcompra: idOrdemCompra,
          idsituacaoordemcompra: idSituacao,
          idusuario: idUsuario,
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
      attributes: [
        ["idocorrencia", "id"],
        ["createdAt", "data"],
        "observacoes",
        [Sequelize.col("tbsituacaoordemcompra.nome"), "situacao"],
        [Sequelize.col("tbusuario.nome"), "usuario"],
      ],
      where: {
        idordemcompra: idOrdemCompra,
      },
      include: [
        {
          model: models.tbsituacaoordemcompra,
          attributes: [],
        },
        {
          model: models.tbusuario,
          attributes: [],
        },
      ],
      order: [["createdAt", "desc"]],
      raw: true,
    });

    const ocorrenciasTratadas = ocorrencias.map((ocorrencia) => {
      const data = new Date(ocorrencia.data).toLocaleDateString();
      const hora = new Date(ocorrencia.data).toLocaleTimeString();

      delete ocorrencia.data;

      return {
        ...ocorrencia,
        data,
        hora,
      };
    });

    return ok({
      ocorrencias: ocorrenciasTratadas,
    });
  },
};
