const {
  OkStatus,
  ErrorStatus,
  DatabaseFailure,
  CaixaJaAberto,
} = require("../modules/codes");
const { ok, failure } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

const { CONTROLE_CAIXA_PAGE_SIZE } = require("../modules/constants");

module.exports = {
  async listarCaixas() {
    const caixas = await models.tbcontrolecaixa.findAll({
      order: [["idcaixa", "desc"]],
      raw: true,
      nest: true,
    });

    for (const caixa of caixas) {
      // Inclusão dos usuários
      // const operadorAbertura = caixa["idusuarioabertura"];
      // const operadorFechamento = caixa["idoperadorfechamento"];
      // const operadorConferencia = caixa["idoperadorconferencia"];
    }

    return ok({
      status: OkStatus,
      response: {
        caixas,
      },
    });
  },

  async criarCaixa(token) {
    console.log(token);

    // Procurar por caixas que já estejam abertos no momento
    const caixasAbertos = await models.tbcontrolecaixa.findAll({
      where: {
        idsituacao: 1,
      },
    });

    if (caixasAbertos.length > 0) {
      return failure({
        status: ErrorStatus,
        code: CaixaJaAberto,
        message:
          "Já existe um caixa aberto no momento, feche o caixa aberto para iniciar um novo caixa.",
      });
    }

    const caixa = await models.tbcontrolecaixa.create({
      idsituacao: 1,
      idoperadorabertura: token["sub"],
      dataabertura: new Date(),
    });

    if (caixa) {
      return ok({
        status: OkStatus,
        response: caixa,
      });
    } else {
      return failure({
        status: ErrorStatus,
        code: DatabaseFailure,
        message:
          "Não foi possível realizar o registro do caixa no banco de dados.",
      });
    }
  },

  async lerCaixa(idCaixa) {
    const caixa = await models.tbcontrolecaixa.findOne({
      attributes: [
        ["idcaixa", "idCaixa"],
        ["idsituacao", "idSituacao"],
        ["idoperadorabertura", "idOperadorAbertura"],
        ["idoperadorfechamento", "idOperadorFechamento"],
        ["idoperadorconferencia", "idOperadorConferencia"],
        ["dataabertura", "dataAbertura"],
        ["datafechamento", "dataFechamento"],
        ["dataconferencia", "dataConferencia"],
      ],
      where: {
        idcaixa: idCaixa,
      },
      raw: true,
      nest: true,
    });

    if (caixa) {
      // Adquire dados do operador de abertura do caixa
      const operadorAbertura = await models.tbusuario.findOne({
        attributes: ["nome"],
        where: {
          idusuario: caixa["idOperadorAbertura"],
        },
        raw: true,
      });

      if (operadorAbertura)
        caixa["operadorAbertura"] = operadorAbertura["nome"];

      // Adquire dados do operador de fechamento do caixa
      const operadorFechamento = await models.tbusuario.findOne({
        attributes: ["nome"],
        where: {
          idusuario: caixa["idOperadorFechamento"],
        },
        raw: true,
      });

      if (operadorFechamento)
        caixa["operadorFechamento"] = operadorFechamento["nome"];

      // Adquire dados do operador de conferência do caixa
      const operadorConferencia = await models.tbusuario.findOne({
        attributes: ["nome"],
        where: {
          idusuario: caixa["idOperadorConferencia"],
        },
        raw: true,
      });

      if (operadorConferencia)
        caixa["operadorFechamento"] = operadorConferencia["nome"];

      this.pedidosPorCaixa(idCaixa);

      return ok({
        status: OkStatus,
        response: {
          caixa,
        },
      });
    }
  },

  async pedidosPorCaixa(idCaixa) {
    const caixa = await models.tbcontrolecaixa.findOne({
      where: {
        idcaixa: idCaixa,
      },
    });

    // Definir a data de abertura do caixa
    // No banco de dados, as datas são salvas em UTC
    // O filtro de busca por ocorrências precisa ser feito em UTC
    let dataInicial = dayjs(caixa["dataabertura"]).format(
      "YYYY-MM-DD HH:mm:ss"
    );

    let dataFinal = dayjs(caixa["dataabertura"])
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    console.log(dataInicial, dataFinal);

    if (caixa) {
      const pedidos = await models.tbpedidovenda.findAll({
        attributes: [["idpedidovenda", "idPedidoVenda"]],
        where: {
          idloja: "203398261",
        },
        include: [
          {
            model: models.tbocorrenciavenda,
            attributes: [],
            where: {
              situacao: "Atendido",
              dataocorrencia: {
                [Op.between]: [dataInicial, dataFinal],
              },
            },
          },
        ],
        raw: true,
        nest: true,
        useUTC: true,
      });

      console.log(pedidos.length);
    }
  },
};
