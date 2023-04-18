const { ok } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const currency = require("currency.js");

const dayjsBusinessDays = require("dayjs-business-days2").default;
const dayjsConfig = require("../utils/dayjsConfig");

dayjs.extend(dayjsBusinessDays, dayjsConfig);

module.exports = {
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

  async montarDicionarioFormasPagamentos() {
    // Enumera as formas de pagamentos existentes para as parcelas em formato de dicionário

    // {
    //   "Reposição de estoque à vista": "ID",
    //   "Reposição de estoque faturado": "ID"
    // }

    const categoriasFormasPagamento = await models.tbformapagamento.findAll({
      attributes: ["idformapagamento", "descricao"],
      where: {
        descricao: {
          [Op.in]: ["Reposição de estoque à vista", "Reposição de estoque faturado"],
        },
      },
      raw: true,
    });

    let dicionarioFormasPagamento = {};

    categoriasFormasPagamento.forEach((categoria) => {
      dicionarioFormasPagamento[categoria.descricao] = categoria.idformapagamento;
    });

    return dicionarioFormasPagamento;
  },

  async adquirirBudgets(inicioPeriodo) {
    // Adquire os budgets referente ao mês vigente informado e retorna em formato de dicionário

    // {
    //   "idCategoria": valorBudget,
    //   "idCategoria": valorBudget
    // }

    const budgetsFiltrados = await models.tbbudgetcompras.findAll({
      attributes: ["idbudget", "datainicio", "valor", "idcategoria"],
      where: {
        datainicio: inicioPeriodo,
      },
      raw: true,
    });

    let budgets = {};

    budgetsFiltrados.forEach((budget) => {
      budgets[budget.idcategoria] = budget.valor;
    });

    return budgets;
  },

  async queryPedidosCompra(inicioPeriodo, finalPeriodo) {
    const dicionarioFormasPagamento = await this.montarDicionarioFormasPagamentos();

    const pedidosPeriodo = await models.tbpedidocompra.findAll({
      attributes: ["idpedidocompra", "idstatus", "datacriacao", "idcategoria"],
      where: {
        datacriacao: {
          [Op.between]: [inicioPeriodo, finalPeriodo],
        },
        idstatus: {
          [Op.in]: [0, 1, 3],
        },
      },
      include: [
        {
          model: models.tbfornecedor,
          required: true,
          attributes: ["nomefornecedor"],
        },
        {
          model: models.tbparcelapedidocompra,
          required: true,
          attributes: ["idparcela", "valor", "idformapagamento"],
        },
      ],
      order: [["datacriacao", "desc"]],
      nest: true,
    });

    const pedidos = [];

    for (const _pedido of pedidosPeriodo) {
      const pedido = JSON.parse(JSON.stringify(_pedido));

      // Acumular parcelas para definir valor total do pedido e valor total considerado
      let valorPedido = currency(0);
      let valorConsiderado = currency(0);

      pedido.tbparcelapedidocompras.forEach((parcela) => {
        valorPedido = valorPedido.add(currency(parcela.valor));

        if (
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque à vista"] ||
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque faturado"]
        ) {
          valorConsiderado = valorConsiderado.add(currency(parcela.valor));
        }
      });

      pedido["total"] = valorPedido;
      pedido["totalConsiderado"] = valorConsiderado;

      pedidos.push(pedido);
    }

    return pedidos;
  },

  async dashboard(mes, ano) {
    const dicionarioCategorias = await this.montarDicionarioCategorias();
    const dicionarioFormasPagamento = await this.montarDicionarioFormasPagamentos();

    // Definir o período vigente para o cálculo
    const dicionarioMeses = {
      Jan: "01",
      Fev: "02",
      Mar: "03",
      Abr: "04",
      Mai: "05",
      Jun: "06",
      Jul: "07",
      Ago: "08",
      Set: "09",
      Out: "10",
      Nov: "11",
      Dez: "12",
    };

    const inicioPeriodo = dayjs(`01/${dicionarioMeses[mes]}/${ano}`, "DD/MM/YYYY")
      .startOf("month")
      .format("YYYY-MM-DD HH:mm:ss");

    const finalPeriodo = dayjs(`01/${dicionarioMeses[mes]}/${ano}`, "DD/MM/YYYY")
      .endOf("month")
      .format("YYYY-MM-DD HH:mm:ss");

    // Adquirir os budgets existentes para o mês vigente
    const budgets = await this.adquirirBudgets(inicioPeriodo);

    let budgetNacional = currency(budgets[dicionarioCategorias["Nacional"]] || 0);
    let budgetInternacional = currency(budgets[dicionarioCategorias["Internacional"]] || 0);

    // Adquirir os pedidos de compra dentro do período do mês vigente
    const pedidosPeriodo = await this.queryPedidosCompra(inicioPeriodo, finalPeriodo);

    // Separar lista de pedidos de budget Nacional e Internacional
    let pedidosBudgetNacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria == dicionarioCategorias["Nacional"]
    );

    let pedidosBudgetInternacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria == dicionarioCategorias["Internacional"]
    );

    // Acumular valores utilizados
    let budgetUtilizadoNacional = currency(0);
    let budgetUtilizadoInternacional = currency(0);

    pedidosBudgetNacional.forEach((pedido) => {
      pedido.tbparcelapedidocompras.forEach((parcela) => {
        if (
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque à vista"] ||
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque faturado"]
        ) {
          budgetUtilizadoNacional = currency(budgetUtilizadoNacional).add(currency(parcela.valor));
        }
      });
    });

    pedidosBudgetInternacional.forEach((pedido) => {
      pedido.tbparcelapedidocompras.forEach((parcela) => {
        if (
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque à vista"] ||
          parcela.idformapagamento === dicionarioFormasPagamento["Reposição de estoque faturado"]
        ) {
          budgetUtilizadoInternacional = currency(budgetUtilizadoInternacional).add(currency(parcela.valor));
        }
      });
    });

    // Filtrar pedidos que não possuem parcelas consideráveis (nenhuma parcela de reposição)
    pedidosBudgetNacional = pedidosBudgetNacional.filter((pedido) => pedido.totalConsiderado.value > 0);

    pedidosBudgetInternacional = pedidosBudgetInternacional.filter(
      (pedido) => pedido.totalConsiderado.value > 0
    );

    // Calcular budget diário Nacional e Internacional
    const diasUteis = dayjs(inicioPeriodo).businessDaysInMonth().length;

    let diasCorridos = 1 + diasUteis + dayjs().businessDiff(dayjs().endOf("month"));
    let diasRestantes = diasUteis - diasCorridos;

    // Para calcular a quantidade de dias corridos, verificar se a data é passada
    // Caso seja de um mês passado, atribuir o valor total de dias úteis
    const mesAtual = dayjs().month();
    const mesDoPeriodo = dayjs(inicioPeriodo).month();

    if (mesAtual > mesDoPeriodo) {
      diasCorridos = diasUteis;
      diasRestantes = 0;
    }

    const budgetDiarioInicialNacional = budgetNacional.divide(diasUteis);
    const budgetDiarioInicialInternacional = budgetInternacional.divide(diasUteis);

    let budgetDiarioNacional = budgetNacional.subtract(budgetUtilizadoNacional).divide(diasRestantes);
    let budgetDiarioInternacional = budgetInternacional
      .subtract(budgetUtilizadoInternacional)
      .divide(diasRestantes);

    const budgetEsperadoNacional = budgetDiarioInicialNacional.multiply(diasCorridos);
    const budgetEsperadoInternacional = budgetDiarioInicialInternacional.multiply(diasCorridos);

    let budgetNacionalPercentual = (budgetUtilizadoNacional.divide(budgetEsperadoNacional) * 100).toFixed(2);

    let budgetInternacionalPercentual = (
      budgetUtilizadoInternacional.divide(budgetEsperadoInternacional) * 100
    ).toFixed(2);

    budgetNacionalPercentual = isNaN(budgetNacionalPercentual) ? 0 : budgetNacionalPercentual;
    budgetInternacionalPercentual = isNaN(budgetInternacionalPercentual) ? 0 : budgetInternacionalPercentual;

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

      pedidosBudgetNacional,
      pedidosBudgetInternacional,
    });
  },
};
