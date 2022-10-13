const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { elapsedTime } = require("../utils/time");
const ss = require("simple-statistics");
const debug = require("../utils/debug");

module.exports = {
  async query() {
    console.log(filename, "Iniciando query para análise de curva");

    let queryStart = new Date();

    const resultadosQuery = await models.tbpedidovenda.findAll({
      attributes: ["idpedidovenda", "idstatusvenda", "datavenda", "idloja"],
      include: [
        {
          model: models.tbvendaproduto,
          required: true,
          attributes: ["quantidade", "valorunidade"],
          include: [
            {
              model: models.tbproduto,
              attributes: ["idsku", "idcategoria", "nome"],
              required: true,
              where: {
                situacao: 1,
                idsku: {
                  [Op.regexp]: "^[0-9]+$",
                },
              },
            },
          ],
        },
      ],
      where: {
        // Ignorar pedidos cancelados
        idstatusvenda: {
          [Op.not]: "12",
        },
        // Considerar período de vendas de 1 ano
        datavenda: {
          [Op.gt]: dayjs().subtract(1, "year").format(),
        },
        // Ignorar Lojas - Transferência e SAC
        idloja: {
          [Op.notIn]: ["203564921", "203674710"],
        },
      },
      raw: true,
      nest: true,
    });

    const relacionamentos = resultadosQuery.map((res) => {
      return {
        idpedidovenda: res.idpedidovenda,
        idstatusvenda: res.idstatusvenda,
        datavenda: res.datavenda,
        idloja: res.idloja,
        idsku: res.tbvendaprodutos.tbproduto.idsku,
        nome: res.tbvendaprodutos.tbproduto.nome,
        quantidade: res.tbvendaprodutos.quantidade,
        idcategoria: res.tbvendaprodutos.tbproduto.idcategoria,
        valorunidade: parseFloat(res.tbvendaprodutos.valorunidade),
      };
    });

    console.log(filename, "Tempo gasto na query:", elapsedTime(queryStart));

    return relacionamentos;
  },

  gerarQuantidadesVendidas(relacionamentos) {
    // Gerar um dicionário que contenha uma lista com as quantidades vendidas de cada item

    // {
    //   "1810": [10, 20, 30, ...],
    //   "1811": [40, 50, 60, ...]
    // }

    let quantidadesVendidas = {};

    relacionamentos.forEach((rel) => {
      let quantidades = quantidadesVendidas[rel.idsku] || [];
      quantidades.push(rel.quantidade);
      quantidadesVendidas[rel.idsku] = quantidades;
    });

    return quantidadesVendidas;
  },

  calcularDestoantes(quantidadesVendidas) {
    // O parâmetro para cálculo do desvio padrão deve ser uma array com as quantidades vendidas
    // O valor destoante será igual ao valor de media + desvio padrão das quantidades vendidas

    // O resultado é um dicionário com o valor destoante para cada SKU
    // {
    //   "1810": 10,
    //   "1811": 20,
    // }

    let destoantes = {};

    for (const idsku in quantidadesVendidas) {
      const quantidades = quantidadesVendidas[idsku];
      const media = Number(ss.mean(quantidades).toFixed(2));
      const desvio = Number(ss.standardDeviation(quantidades).toFixed(2));
      const destoante = Number(parseFloat(media + desvio).toFixed(2));

      destoantes[idsku] = destoante;
    }

    return destoantes;
  },

  filtrarDestoantes(relacionamentos, destoantes) {
    const filtrados = relacionamentos.filter((registro) => {
      const valorCorte = destoantes[registro.idsku];

      if (valorCorte) {
        if (registro.quantidade >= valorCorte && registro.idloja == "203398134") return false;
      }

      return true;
    });

    return filtrados;
  },

  calcularMediaMes() {},

  async analiseCurva() {
    // Adquirir todos os relacionamentos de venda-produto
    const relacionamentos = await this.query();

    console.log(filename, "Quantidade de registros processados:", relacionamentos.length);

    let memoryStart = new Date();

    // Gerar dicionário de quantidades vendidas
    const quantidadesVendidas = this.gerarQuantidadesVendidas(relacionamentos);

    // Calcular valores destoantes para cada produto
    const destoantes = this.calcularDestoantes(quantidadesVendidas);

    // Remover registros com quantidades destoantes da lista
    const destoantesFiltrados = this.filtrarDestoantes(relacionamentos, destoantes);

    console.log(filename, "Quantidade de registros filtrados:", destoantesFiltrados.length);

    console.log(filename, "Tempo gasto no processamento em memória:", elapsedTime(memoryStart));

    return ok({
      message: "Alive",
    });
  },
};
