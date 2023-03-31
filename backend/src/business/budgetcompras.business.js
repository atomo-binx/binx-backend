const { ok } = require("../modules/http");

const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

module.exports = {
  async dashboard() {
    // Listar budgets para o mês vigente

    const inicioMes = dayjs().startOf("month").format("YYYY-MM-DD HH:mm:ss");

    console.log({ inicioMes });

    const budgetsBrutos = await models.tbbudgetcompras.findAll({
      raw: true,
    });

    console.log({ budgetsBrutos });

    const budgetsFiltrados = await models.tbbudgetcompras.findAll({
      where: {
        datainicio: inicioMes,
      },
      raw: true,
    });

    console.log({ budgetsFiltrados });

    let dataBudgetFormatada = "";

    if (budgetsFiltrados.length > 0) {
      dataBudgetFormatada = dayjs(budgetsFiltrados[0].datainicio).format("YYYY-MM-DD HH:mm:ss");
      console.log({ dataBudgetFormatada });
    }

    return ok({
      inicioMes,
      budgetsBrutos,
      budgetsFiltrados,
      dataBudgetFormatada,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  },
};
