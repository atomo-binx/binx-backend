const { ok } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { dictionary } = require("../utils/dict");
const currency = require("currency.js");

const dayjsBusinessDays = require("dayjs-business-days2").default;

dayjs.extend(dayjsBusinessDays);

module.exports = {
  // Objetivos

  // Budget Nacional
  // Budget Internacional

  // Utilizado Nacional
  // Utilizado Internacional

  // Budget Diario Nacional
  // Budget Diario Internacional

  // Progresso Nacional
  // Progresso Internacional

  async montarDicionarioCategorias() {
    // Enumera as categorias de pedidos de compra em formato de dicionario

    // {
    //   "Nacional": "ID",
    //   "Internacional": "ID"
    // }

    const categoriasPedidoCompra = await models.tbcategoriapedidocompra.findAll({
      attributes: ["idcategoria", "descricao"],
      where: {
        descricao: {
          [Op.in]: ["Nacional", "Internacional"],
        },
      },
      raw: true,
    });

    let dicionarioCategorias = {};

    categoriasPedidoCompra.forEach((categoria) => {
      dicionarioCategorias[categoria.descricao] = categoria.idcategoria;
    });

    return dicionarioCategorias;
  },

  async adquirirBudgets(inicioMes) {
    // Adquire os budgets referente ao mês vigente informado e retorna em formato de dicionário

    // {
    //   "idCategoria": valorBudget,
    //   "idCategoria": valorBudget
    // }

    const budgetsFiltrados = await models.tbbudgetcompras.findAll({
      attributes: ["idbudget", "datainicio", "valor", "idcategoria"],
      where: {
        datainicio: inicioMes,
      },
      raw: true,
    });

    let budgets = {};

    budgetsFiltrados.forEach((budget) => {
      budgets[budget.idcategoria] = budget.valor;
    });

    return budgets;
  },

  async queryPedidosCompra(inicioMes, finalMes) {
    const pedidosPeriodo = await models.tbpedidocompra.findAll({
      attributes: [
        "idpedidocompra",
        "idstatus",
        "datacriacao",
        "dataconclusao",
        "dataprevista",
        "idcategoria",
      ],
      where: {
        datacriacao: {
          [Op.between]: [inicioMes, finalMes],
        },
      },
      include: [
        {
          model: models.tbparcelapedidocompra,
          attributes: ["idparcela", "valor", "idformapagamento"],
          required: true,
        },
      ],
      nest: true,
    });

    return pedidosPeriodo;
  },

  async dashboard() {
    // Montar dicionário de categorias de pedidos de compra
    const dicionarioCategorias = await this.montarDicionarioCategorias();

    // Definir o início do mês vigente para cálculo de budget
    const inicioMes = dayjs().startOf("month").format("YYYY-MM-DD HH:mm:ss");
    const finalMes = dayjs().endOf("month").format("YYYY-MM-DD HH:mm:ss");

    // Adquirir os budgets existentes para o mês vigente
    const budgets = await this.adquirirBudgets(inicioMes);

    let budgetNacional = currency(budgets[dicionarioCategorias["Nacional"]] || 0);
    let budgetInternacional = currency(budgets[dicionarioCategorias["Internacional"]] || 0);

    // Adquirir os pedidos de compra dentro do período do mês vigente
    const pedidosPeriodo = await this.queryPedidosCompra(inicioMes, finalMes);

    // Separar lista de pedidos de budget Nacional e Internacional
    const pedidosBudgetNacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria == dicionarioCategorias["Nacional"]
    );

    const pedidosBudgetInternacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria == dicionarioCategorias["Internacional"]
    );

    // Acumular valor para pedidos de budget Nacional
    let budgetUtilizadoNacional = 0;
    let budgetUtilizadoInternacional = 0;

    pedidosBudgetNacional.forEach((pedido) => {
      pedido.tbparcelapedidocompras.forEach((parcela) => {
        budgetUtilizadoNacional = currency(budgetUtilizadoNacional).add(currency(parcela.valor));
      });
    });

    pedidosBudgetInternacional.forEach((pedido) => {
      pedido.tbparcelapedidocompras.forEach((parcela) => {
        budgetUtilizadoInternacional = currency(budgetUtilizadoInternacional).add(currency(parcela.valor));
      });
    });

    // Calcular budget diário Nacional e Internacional
    const diasUteis = dayjs().businessDaysInMonth().length;
    const diasCorridos = 1 + diasUteis + dayjs().businessDiff(dayjs().endOf("month"));
    const diasRestantes = diasUteis - diasCorridos;

    const budgetDiarioInicialNacional = budgetNacional.divide(diasUteis);
    const budgetDiarioInicialInternacional = budgetInternacional.divide(diasUteis);

    let budgetDiarioNacional = budgetNacional.subtract(budgetUtilizadoNacional).divide(diasRestantes);
    let budgetDiarioInternacional = budgetInternacional
      .subtract(budgetUtilizadoInternacional)
      .divide(diasRestantes);

    const budgetEsperadoNacional = budgetDiarioInicialNacional.multiply(diasCorridos);
    const budgetEsperadoInternacional = budgetDiarioInicialInternacional.multiply(diasCorridos);

    const budgetNacionalPercentual = (budgetUtilizadoNacional.divide(budgetEsperadoNacional) * 100).toFixed(
      2
    );

    const budgetInternacionalPercentual = (
      budgetUtilizadoInternacional.divide(budgetEsperadoInternacional) * 100
    ).toFixed(2);

    return ok({
      budgetNacional,
      budgetInternacional,
      budgetUtilizadoNacional,
      budgetUtilizadoInternacional,
      budgetDiarioNacional,
      budgetDiarioInternacional,
      quantidadePedidosPeriodo: pedidosPeriodo.length,
      quantidadePedidosNacional: pedidosBudgetNacional.length,
      quantidadePedidosInternacional: pedidosBudgetInternacional.length,

      diasUteis,
      diasCorridos,
      diasRestantes,

      budgetNacionalPercentual,
      budgetInternacionalPercentual,
    });
  },
};
