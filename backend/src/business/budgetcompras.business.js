const { ok } = require("../modules/http");

const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { dictionary } = require("../utils/dict");
const currency = require("currency.js");

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

  async dashboard() {
    // Adquirir as categorias dos pedidos de compra
    const categoriasPedidoCompra = await models.tbcategoriapedidocompra.findAll({
      attributes: ["idcategoria", "descricao"],
      where: {
        descricao: {
          [Op.in]: ["Nacional", "Internacional"],
        },
      },
      raw: true,
    });

    // Enumera as categorias de pedido de compra em formato de dicionário
    const dicionarioCategorias = dictionary(categoriasPedidoCompra, "descricao");

    // Definir o início do mês vigente para cálculo de budget
    const inicioMes = dayjs().startOf("month").format("YYYY-MM-DD HH:mm:ss");
    const finalMes = dayjs().endOf("month").format("YYYY-MM-DD HH:mm:ss");

    // Adquirir os budgets presentes para o início do mês vigente
    const budgetsFiltrados = await models.tbbudgetcompras.findAll({
      attributes: ["idbudget", "datainicio", "valor", "idcategoria"],
      where: {
        datainicio: inicioMes,
      },
      raw: true,
    });

    // Definir valores de budgets Nacional e Internacional
    let budgets = {};

    budgetsFiltrados.forEach((budget) => {
      budgets[budget.idcategoria] = budget.valor;
    });

    let budgetNacional = budgets[dicionarioCategorias["Nacional"].idcategoria] || 0;
    let budgetInternacional = budgets[dicionarioCategorias["Internacional"].idcategoria] || 0;

    // Adquirir os pedidos de compra dentro do período do mês vigente
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

      raw: true,
    });

    const pedidosBudgetNacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria === dicionarioCategorias["Nacional"].idcategoria
    );

    const pedidosBudgetInternacional = pedidosPeriodo.filter(
      (pedido) => pedido.idcategoria === dicionarioCategorias["Internacional"].idcategoria
    );

    let parcelasBudgetNacional = {};

    for (const pedido of pedidosBudgetNacional) {
      const parcelas = await models.tbparcela.findAll({
        attributes: ["valor"],
        where: {
          idpedido: pedido.idpedidocompra,
        },
        raw: true,
      });

      // parcelasBudgetNacional[pedido.idpedidocompra]: parcelas
    }

    return ok({
      budgetNacional,
      budgetInternacional,
      quantidadePedidosPeriodo: pedidosPeriodo.length,
      quantidadePedidosNacional: pedidosBudgetNacional.length,
      quantidadePedidosInternacional: pedidosBudgetInternacional.length,
    });
  },
};
