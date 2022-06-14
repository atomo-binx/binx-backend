const { OkStatus, ErrorStatus, CaixaJaAberto } = require("../modules/codes");
const { ok, failure } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const currency = require("currency.js");

const { BRLString } = require("../utils/money");

module.exports = {
  async listarCaixas() {
    const caixas = await models.tbcaixa.findAll({
      attributes: [
        ["idcaixa", "idCaixa"],
        ["IdSituacao", "idSituacao"],
        ["dataabertura", "dataAbertura"],
        ["idoperadorabertura", "idOperadorAbertura"],
      ],
      order: [["idcaixa", "desc"]],
      raw: true,
      nest: true,
    });

    for (const caixa of caixas) {
      // Inclusão dos usuários
      const operadorAbertura = await models.tbusuario.findOne({
        attributes: ["nome"],
        where: {
          idusuario: caixa["idOperadorAbertura"],
        },
        raw: true,
      });

      caixa["operadorAbertura"] = operadorAbertura["nome"];

      // Incluir situação
      const situacao = await models.tbsituacaocaixa.findOne({
        attributes: ["nome"],
        where: {
          idsituacao: caixa["idSituacao"],
        },
        raw: true,
      });

      caixa["situacao"] = situacao["nome"];
    }

    return ok({
      status: OkStatus,
      response: {
        caixas,
      },
    });
  },

  async criarCaixa(token, trocoAbertura) {
    // console.log(token);

    // Procurar por caixas que já estejam abertos no momento
    const caixasAbertos = await models.tbcaixa.findAll({
      where: {
        idsituacao: 1,
      },
    });

    if (caixasAbertos.length < 0) {
      return failure({
        status: ErrorStatus,
        code: CaixaJaAberto,
        message:
          "Já existe um caixa aberto no momento, feche o caixa aberto para iniciar um novo caixa.",
      });
    }

    const caixa = await models.caixa.create({
      idsituacao: 1,
      idoperadorabertura: token["sub"],
      dataabertura: new Date(),
      trocoabertura: parseFloat(trocoAbertura),
    });

    return ok({
      status: OkStatus,
      response: caixa,
    });
  },

  async lerCaixa(idCaixa) {
    const caixa = await models.tbcaixa.findOne({
      attributes: [
        ["idcaixa", "idCaixa"],
        ["idsituacao", "idSituacao"],
        ["idoperadorabertura", "idOperadorAbertura"],
        ["idoperadorfechamento", "idOperadorFechamento"],
        ["idoperadorconferencia", "idOperadorConferencia"],
        ["dataabertura", "dataAbertura"],
        ["datafechamento", "dataFechamento"],
        ["dataconferencia", "dataConferencia"],
        ["trocoabertura", "trocoAbertura"],
        ["trocofechamento", "trocoFechamento"],
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

      // Adquirir os pedidos considerados para este caixa
      const pedidosConsiderados = await this.pedidosPorCaixa(idCaixa);
      caixa["pedidosConsiderados"] = pedidosConsiderados;

      // Acumular os valores registrados
      const valoresRegistrados = await this.acumularValoresRegistrados(
        pedidosConsiderados
      );
      caixa["valoresRegistrados"] = valoresRegistrados;

      // Adquirir valores informados
      // TODO: adquirir valores informados
      const valoresInformados = [];

      // Interpolar valores registrados com valores informados
      let valores = await this.interpolarValores(
        valoresRegistrados,
        valoresInformados
      );

      caixa["valores"] = valores;

      return ok({
        status: OkStatus,
        response: {
          caixa,
        },
      });
    }
  },

  async fecharCaixa(token, idCaixa, valores) {},

  async pedidosPorCaixa(idCaixa) {
    const caixa = await models.tbcaixa.findOne({
      where: {
        idcaixa: idCaixa,
      },
    });

    // Definir as datas iniciais e finais para consideração do período de caixa
    let dataInicial = dayjs(caixa["dataabertura"])
      .startOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    let dataFinal = dayjs(caixa["dataabertura"])
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    const pedidos = await models.tbpedidovenda.findAll({
      attributes: [
        ["idpedidovenda", "idPedidoVenda"],
        ["cliente", "cliente"],
        ["formapagamento", "formaPagamento"],
        ["totalvenda", "totalVenda"],
        ["datavenda", "dataVenda"],
      ],
      where: {
        idloja: "203398261",
      },
      include: [
        {
          model: models.tbocorrenciavenda,
          attributes: [["dataocorrencia", "dataOcorrencia"]],
          where: {
            situacao: "Atendido",
            dataocorrencia: {
              [Op.between]: [dataInicial, dataFinal],
            },
          },
        },
      ],
      group: "idPedidoVenda",
      raw: true,
      nest: true,
    });

    // console.log("Pedidos registrados:", pedidos);

    return pedidos;
  },

  async acumularValoresRegistrados(pedidos) {
    const registros = {};

    pedidos.forEach((pedido) => {
      if (
        Object.prototype.hasOwnProperty.call(registros, pedido.formaPagamento)
      ) {
        // Forma de pagamento já existe, acumular valor
        const acumulado = currency(registros[pedido.formaPagamento]).add(
          pedido["totalVenda"]
        );

        registros[pedido.formaPagamento] = acumulado;
      } else {
        // Forma de pagamento não registrada, criar e acumular
        registros[pedido.formaPagamento] = currency(pedido["totalVenda"]);
      }
    });

    return registros;
  },

  async interpolarValores(registrados, informados) {
    let valores = {};

    for (const valor in registrados) {
      if (Object.prototype.hasOwnProperty.call(valores, valor)) {
        valores[valor]["registrado"] = registrados["valor"];
      } else {
        valores[valor] = {
          registrado: registrados[valor],
          informado: 0,
        };
      }
    }

    for (const valor in informados) {
      if (Object.prototype.hasOwnProperty.call(valores, valor)) {
        valores[valor]["informado"] = informados["valor"];
      } else {
        valores[valor] = {
          registrado: 0,
          informado: informados[valor],
        };
      }
    }

    // Converter a estrutura de objeto para lista
    // Nessa etapa calcula também a diferença entre os dois valores

    // Estrutura inicial
    // {
    //   "Forma de Pagamento" :{
    //     "registrado": "0",
    //     "informado": "0"
    //   }
    // }

    // Estrutura final
    // [
    //   {
    //     "formaPagamento": "Forma de Pagamento",
    //     "registrado": "0",
    //     "informado": "0",
    //   }
    // ]

    let valoresLista = [];

    for (const valor in valores) {
      valoresLista.push({
        formaPagamento: valor,
        registrado: BRLString(valores[valor]["registrado"], ""),
        informado: BRLString(valores[valor]["informado"], ""),
        diferencas: BRLString(
          currency(valores[valor]["informado"]).subtract(
            currency(valores[valor]["registrado"])
          ),
          ""
        ),
      });
    }

    return valoresLista;
  },
};
